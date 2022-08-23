import * as THREE from 'three';
import DefaultScene from '../index.js';
import { createMenu, MENU_CONFIG, setGUI, Spinner } from './utils';

const globalState = {
  currentObjects: [],
  stats: null,
  statsMesh: null,
  model: null,
  spinner: Spinner(),
};

new DefaultScene({
  renderer: {
    canvas: document.querySelector('canvas'),
    antialias: true,
    configure: renderer => {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    },
  },
  scene: {
    configure: scene => {},
  },
  controllers: {
    // showRay: false,
  },
  teleportation: true,
  // teleportation: {
  //   targets: [],
  // },
  // camera: () => {
  //   const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 1000);
  //   camera.position.set(0, 0, 10);
  //   return camera;
  // },

  async onReady(DS) {
    const { scene, controllers } = DS;
    updateScene({ DS, scene, roomSettings: MENU_CONFIG[0].roomSettings });

    DS.observer.position.z = 3;
    DS.observer.rotation.y = Math.PI * 1.5;

    const menu = createMenu();
    scene.add(menu);

    // const camera = new THREE.PerspectiveCamera();
    // camera.position.set(-5, 5, 5);
    // camera.lookAt(0, 0, 0);
    // DS.camera = camera;

    MENU_CONFIG.map(({ name, roomSettings }, i) => {
      const item = menu.children[i];
      const objects = [item];

      const onPointerEnter = () => item.material.color.set(0x00ffff);
      const onPointerLeave = () =>
        item.material.color.set(roomSettings.backgroundColor);
      const onSelectStart = () => {
        updateScene({ DS, scene, roomSettings: MENU_CONFIG[i].roomSettings });
        controllers.off(1, 'pointerenter', onPointerEnter, objects);
      };

      controllers.on(1, 'pointerenter', onPointerEnter, objects);
      controllers.on(1, 'pointerleave', onPointerLeave, objects);
      controllers.on(1, 'selectstart', onSelectStart, objects);
    });

    // DS.loadAudio({
    //   url: '/public/guitar.mp3',
    //   targetMesh: DS.scene,
    //   listenerMeshes: [DS.observer],
    //   onLoad(sound, listener) {
    //     sound.setRefDistance(20);
    //     sound.setLoop(true);
    //     sound.setVolume(0.5);
    //     sound.onend = () => {
    //       sound.stop();
    //       DS.scene.remove(sound);
    //       listener.remove(DS.scene);
    //     };
    //     // sound.play();
    //   },
    // });

    scene.add(globalState.spinner);
    globalState.spinner.visible = false;
  },
  update() {
    if (globalState.stats) globalState.stats.update();
    if (globalState.statsMesh) globalState.statsMesh.material.map.update();

    if (globalState.spinner.visible) {
      globalState.spinner.rotation.z += 0.01;
    }
  },
});

function updateScene({ DS, scene, roomSettings }) {
  const { backgroundColor, objects, fog } = roomSettings;
  scene.background = new THREE.Color(backgroundColor);
  scene.fog = fog;
  globalState.currentObjects.forEach(obj => scene.remove(obj));

  const teleportTargets = [];
  const promises = objects.map(async obj => {
    const mesh = obj.mesh || (await obj.getMesh());

    scene.add(mesh);
    globalState.currentObjects.push(mesh);
    if (obj.teleportation === true) teleportTargets.push(mesh);

    // TODO - if we add more than 1 GUI - we need to remove the old one
    if (obj.gui) {
      setGUI({
        model: mesh,
        renderer: DS.renderer,
        camera: DS.camera,
        observer: DS.observer,
        globalState,
      });
    }
  });

  DS.teleportation.updateTargets(teleportTargets);
  globalState.spinner.visible = true;

  Promise.all(promises).then(() => {
    globalState.spinner.visible = false;
  });
}
