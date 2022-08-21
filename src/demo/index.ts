import * as THREE from 'three';
import DefaultScene from '../index.js';
import {
  createMenu,
  getFloor,
  getLight,
  LIGHT_TYPES,
  MENU_CONFIG,
  setGUI,
} from './utils';

const globalState = {
  objects: {
    light: getLight(LIGHT_TYPES.DIRECTIONAL, [4, 4, -15], 0.2),
    light2: getLight(LIGHT_TYPES.AMBIENT, [0, 10, 0], 0.5),
    box: new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    ),
    floor: getFloor('#282d3a', [0, 0, 0]),
  },
  stats: null,
  statsMesh: null,
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
    configure: scene => {
      scene.background = new THREE.Color('#19202f');
    },
  },
  // controllers: {
  //   showRay: false,
  // },
  // orbitControls: true,
  // camera: () => {
  //   const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 1000);
  //   camera.position.set(0, 0, 10);
  //   return camera;
  // },
  orbitControls: true,
  axesHelper: true,
  // gridHelper: true,
  teleportation: {
    targets: [globalState.objects.floor],
  },
  async onReady(DS) {
    const { scene, controllers } = DS;
    const { light, light2, floor, box } = globalState.objects;

    DS.observer.position.z = 3;
    DS.observer.rotation.y = Math.PI * 1.5;

    scene.add(floor);
    scene.add(light);
    scene.add(light2);

    box.position.y = 1.5;
    box.castShadow = true;
    box.receiveShadow = true;
    floor.receiveShadow = true;

    // const camera = new THREE.PerspectiveCamera();
    // camera.position.set(-5, 5, 5);
    // camera.lookAt(0, 0, 0);
    // DS.camera = camera;

    const menu = createMenu();
    scene.add(menu);

    setGUI({
      model: menu.children[0],
      renderer: DS.renderer,
      camera: DS.camera,
      observer: DS.scene,
      globalState,
    });

    MENU_CONFIG.map(({ name, background, roomSettings }, i) => {
      const item = menu.children[i];
      const objects = [item];

      const onPointerEnter = () => item.material.color.set(0x00ffff);
      const onPointerLeave = () => item.material.color.set(background);
      const onSelectStart = () => {
        // changeScene(roomSettings);
        controllers.off(1, 'pointerenter', onPointerEnter, objects);
      };

      controllers.on(1, 'pointerenter', onPointerEnter, objects);
      controllers.on(1, 'pointerleave', onPointerLeave, objects);
      controllers.on(1, 'selectstart', onSelectStart, objects);
    });

    const model = await DS.loadModel({
      url: '/public/360_sphere_robot/scene.gltf',
      position: [2, 2.5, 2],
      castShadow: false,
    });

    // DS.teleportation.addTargets([box, model]);
    box.castShadow = true;
    box.receiveShadow = true;
    floor.receiveShadow = true;

    // setGUI({
    //   model,
    //   renderer: DS.renderer,
    //   camera: DS.camera,
    //   observer: DS.observer,
    // });
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
  },
  update(time) {
    // globalState.objects.light.position.x = 3 * Math.sin(time);
    if (globalState.stats) globalState.stats.update();
    if (globalState.statsMesh) globalState.statsMesh.material.map.update();
  },
});

function changeScene({
  backgroundColor,
  floorColor,
  lightType,
  colorIntensity,
  children,
  scene,
  floor,
}) {
  scene.background = new THREE.Color(backgroundColor);
  floor.material.color.set(floorColor);

  const light = getLight(lightType, [0, 10, 0], colorIntensity);
  scene.remove(globalState.objects.light);
  globalState.objects.light = light;
  scene.add(light);

  children.map(child => {
    scene.add(child);
  });

  // floorTexture: '/public/floor.png',
}
