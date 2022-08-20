import * as THREE from 'three';
import { GUI } from 'dat.gui';

import DefaultScene from '../src/index.js';

function getFloor(color, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      color,
      depthWrite: false,
      roughness: 0.8,
      metalness: 0.2,
      bumpScale: 0.0005,
    })
  );
  mesh.rotation.x = -Math.PI / 2.0;
  mesh.receiveShadow = true;
  mesh.position.x = x || 0;
  mesh.position.z = z || 0;
  mesh.position.y = y || 0;

  return mesh;
}

enum LIGHT_TYPES {
  PHONG,
  HEMI,
  DIRECTIONAL,
}

const MENU_CONFIG = [
  {
    image: '/public/sunset-text.png',
    position: [-2, 1, -1],
    size: [2, 1, 0],
    name: LIGHT_TYPES.DIRECTIONAL,
    background: 0xff0000,
  },
  {
    image: '/public/street-text.png',
    position: [2, 1, -1],
    size: [2, 1, 0],
    name: LIGHT_TYPES.HEMI,
    background: 0x00ff00,
  },
  {
    image: '/public/logo512.png',
    position: [6, 1, -1],
    size: [2, 1, 0],
    name: LIGHT_TYPES.PHONG,
    background: 0x0000ff,
  },
];

function getLightByType(type) {
  switch (type) {
    case LIGHT_TYPES.PHONG:
      return new THREE.PointLight(0xff0040, 2, 50);
    case LIGHT_TYPES.HEMI:
      return new THREE.AmbientLight(0xffffff, 1);
    default:
      return new THREE.DirectionalLight(0xffffff);
  }
}

function getLight(type, position) {
  const light = getLightByType(type);
  const sphere = new THREE.SphereGeometry(0.1, 16, 8);

  light.position.set(...position);
  light.castShadow = true;
  // light.shadow.camera.top = 2;
  // light.shadow.camera.bottom = -2;
  // light.shadow.camera.left = -2;
  // light.shadow.camera.right = 2;
  // light.shadow.camera.near = 0.1;
  // light.shadow.camera.far = 40;

  light.add(
    new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xff0040 }))
  );

  return light;
}

function createMenu() {
  // const loader = new THREE.TextureLoader();
  const group = new THREE.Group();

  MENU_CONFIG.forEach(({ image, position, size, background }) => {
    // const texture = loader.load(image);
    const material = new THREE.MeshBasicMaterial({ color: background });
    const geometry = new THREE.PlaneGeometry(size[0], size[1] * 0.5);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(...position);

    group.add(mesh);
  });

  return group;
}

const globalState = {
  objects: {
    light: getLight(LIGHT_TYPES.DIRECTIONAL, [0, 10, 0]),
    box: new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    ),

    smallBox: new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    ),

    floor: getFloor('#046582', 0, 0, 0),
    // menu: createMenu(),
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
  orbitControls: true,
  teleportation: {
    targets: [globalState.objects.floor],
  },
  // camera: () => {
  //   const camera = new THREE.OrthographicCamera( -10, 10, 10, -10, 1, 1000 );
  //   camera.position.set(0, 0, 10);
  //   return camera;
  // }

  async onReady(DS) {
    const { scene, controllers } = DS;
    const { light, floor, box, smallBox } = globalState.objects;

    // floor
    scene.add(floor);

    DS.observer.position.z = 3;
    DS.observer.rotation.y = Math.PI * 1.5;

    // const gui = new GUI();
    // const cubeFolder = gui.addFolder('Cube');
    // cubeFolder.add(pointLight.position, 'x', 0, Math.PI * 4);
    // cubeFolder.add(pointLight.position, 'y', 0, Math.PI * 4);
    // cubeFolder.add(pointLight.position, 'z', 0, Math.PI * 4);
    // cubeFolder.open();

    scene.add(light);
    scene.add(box);
    scene.add(smallBox);

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

    box.position.y = 0.5;
    smallBox.position.y = 1.5;
    smallBox.position.x = 0.1;

    const model = await DS.loadModel({
      url: '/public/360_sphere_robot/scene.gltf',
      position: [0, 2, 0],
    });

    model.castShadow = true;
    smallBox.castShadow = true;
    box.castShadow = true;
    box.receiveShadow = true;
    floor.receiveShadow = true;

    DS.loadAudio({
      url: '/public/guitar.mp3',
      targetMesh: DS.scene,
      listenerMeshes: [DS.observer],
      onLoad(sound, listener) {
        sound.setRefDistance(20);
        sound.setLoop(true);
        sound.setVolume(0.5);
        sound.onend = () => {
          sound.stop();
          DS.scene.remove(sound);
          listener.remove(DS.scene);
        };
        sound.play();
      },
    });
  },
  update(time) {
    globalState.objects.light.position.x = 3 * Math.sin(time);
  },
});
