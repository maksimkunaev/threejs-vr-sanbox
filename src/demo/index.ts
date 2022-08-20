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
    light: getLight(LIGHT_TYPES.DIRECTIONAL, [3, 3, -3]),
    light2: getLight(LIGHT_TYPES.AMBIENT, [-3, 3, 3]),
    box: new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    ),
    floor: getFloor('#0d1116', 0, 0, 0),
  },
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
      scene.add(new THREE.AxesHelper(100));
      scene.background = new THREE.Color('#0A1931');
      // scene.fog = new THREE.Fog('#545454e8', 0, 35);
    },
  },
  // controllers: {
  //   showRay: false,
  // },
  // orbitControls: true,
  teleportation: {
    targets: [globalState.objects.floor],
  },
  // camera: () => {
  //   const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 1000);
  //   camera.position.set(0, 0, 10);
  //   return camera;
  // },

  async onReady(DS) {
    const { scene, controllers } = DS;
    const { light, light2, floor, box } = globalState.objects;

    DS.observer.position.z = 3;
    DS.observer.rotation.y = Math.PI * 1.5;

    scene.add(floor);
    scene.add(light);
    scene.add(light2);

    const grid = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    scene.add(grid);

    // const camera = new THREE.PerspectiveCamera();
    // camera.position.set(-5, 5, 5);
    // camera.lookAt(0, 0, 0);
    // DS.camera = camera;

    const menu = createMenu();
    scene.add(menu);

    MENU_CONFIG.map(({ name, background }, i) => {
      const item = menu.children[i];
      const objects = [item];

      const onPointerEnter = () => item.material.color.set(0x00ffff);
      const onPointerLeave = () => item.material.color.set(background);
      const onSelectStart = () => {
        const light = getLight(name, [0, 10, 0]);

        scene.remove(globalState.objects.light);
        globalState.objects.light = light;
        scene.add(light);
        scene.background = new THREE.Color(background);

        controllers.off(1, 'pointerenter', onPointerEnter, objects);
      };

      controllers.on(1, 'pointerenter', onPointerEnter, objects);
      controllers.on(1, 'pointerleave', onPointerLeave, objects);
      controllers.on(1, 'selectstart', onSelectStart, objects);
    });

    const model = await DS.loadModel({
      url: '/public/360_sphere_robot/scene.gltf',
      // position: [2, 0, 2],
      // castShadow: true,
      // scale: [1, 1, 1],
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
  },
});
