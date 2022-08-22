import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { InteractiveGroup } from 'three/examples/jsm/interactive/InteractiveGroup.js';
import { HTMLMesh } from 'three/examples/jsm/interactive/HTMLMesh.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { loadModel } from 'uilib/helpers';

export enum LIGHT_TYPES {
  PHONG,
  HEMI,
  DIRECTIONAL,
  SPOT,
  AMBIENT,
}

export const Spinner = () => {
  const geometry = new THREE.PlaneGeometry(0.3, 0.3);
  const material = new THREE.MeshStandardMaterial({
    color: getRandomColor(),
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);

  const gt = new THREE.TextureLoader().load('/public/spinner.png');
  material.map = gt;
  mesh.position.set(0, 2, 0);

  return mesh;
};

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const generateSpheres = (count: number) => {
  const group = new THREE.Group();

  for (let i = 0; i < count; i++) {
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: getRandomColor(),
      roughness: 0.9,
      metalness: 0.9,
    });
    const sphere = new THREE.Mesh(geometry, material);
    const position = [
      Math.random() * 30 - 15,
      Math.random() * 30 - 15,
      Math.random() * 30 - 15,
    ];

    material.castShadow = true;
    material.receiveShadow = true;

    sphere.position.set(...position);
    group.add(sphere);
  }
  return group;
};

const generateBoxes = (count: number) => {
  const group = new THREE.Group();

  for (let i = 0; i < count; i++) {
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const material = new THREE.MeshStandardMaterial({
      color: getRandomColor(),
      roughness: 0.9,
      metalness: 0.9,
    });
    const box = new THREE.Mesh(geometry, material);
    const position = [
      Math.random() * 30 - 15,
      Math.random() * 30 - 15,
      Math.random() * 30 - 15,
    ];

    material.castShadow = true;
    material.receiveShadow = true;

    box.position.set(...position);
    group.add(box);
  }
  return group;
};

async function getModel(url, position, scale?: number[]) {
  return await loadModel({
    url,
    position,
    scale,
    castShadow: false,
    onProgress: function (xhr: { loaded: number; total: number }) {
      console.log('onProgress...', xhr.loaded / xhr.total);
    },

    onError: arg => console.log('onError', arg),
  });
}

export const MENU_CONFIG = [
  {
    position: [-2, 0.6, -1],
    size: [1, 1.4],
    name: LIGHT_TYPES.DIRECTIONAL,
    background: '#c9d1d9',
    roomSettings: {
      backgroundColor: '#155888',
      objects: [
        {
          name: 'light',
          mesh: getLight(LIGHT_TYPES.DIRECTIONAL, [4, 4, 5], 1),
        },
        {
          name: 'light2',
          mesh: getLight(LIGHT_TYPES.AMBIENT, [0, 5, 0], 1.5),
        },
        {
          name: 'box',
          mesh: generateBoxes(50),
        },
        {
          name: 'floor',
          teleportation: true,
          mesh: getFloor({
            color: '0xfffff',
            repeat: true,
          }),
        },
        {
          name: 'model',
          async: true,
          teleportation: true,
          getMesh: async () =>
            await getModel('/public/360_sphere_robot/scene.gltf', [2, 2.5, 2]),
        },
      ],
    },
  },
  {
    position: [0, 0.6, -1],
    size: [1, 2.4],
    name: LIGHT_TYPES.HEMI,
    background: 0x00ff00,
    roomSettings: {
      backgroundColor: '#237272',
      objects: [
        {
          name: 'light',
          mesh: getLight(LIGHT_TYPES.DIRECTIONAL, [4, 4, -15], 1),
        },
        {
          name: 'light2',
          mesh: getLight(LIGHT_TYPES.AMBIENT, [0, 5, 0], 1.5),
        },
        {
          name: 'box',
          mesh: generateSpheres(50),
        },
        {
          name: 'floor',
          teleportation: true,
          mesh: getFloor({
            color: '0xfffff',
            texture: '/public/spinner.png',
            repeat: true,
          }),
        },
        {
          name: 'model',
          async: true,
          isStats: true,
          teleportation: true,
          getMesh: async () =>
            await getModel('/public/houses/scene.gltf', [-2, 0.1, 2]),
        },
      ],
    },
  },
];

export function getFloor({
  color,
  texture,
  repeat,
}: {
  color: number | string;
  texture?: string;
  repeat?: boolean;
}) {
  const gg = new THREE.PlaneGeometry(20, 20);
  const gm = new THREE.MeshStandardMaterial({ color });

  const ground = new THREE.Mesh(gg, gm);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.material.opacity = 0.8;
  // ground.material.transparent = true;

  if (texture) {
    const gt = new THREE.TextureLoader().load(texture);
    gm.map = gt;

    if (repeat) ground.material.map.repeat.set(20, 20);
    ground.material.map.wrapS = THREE.RepeatWrapping;
    ground.material.map.wrapT = THREE.RepeatWrapping;
    ground.material.map.encoding = THREE.sRGBEncoding;
  }

  return ground;
}

export function getLightByType(type: LIGHT_TYPES, intensity: number) {
  switch (type) {
    case LIGHT_TYPES.PHONG: {
      const light = new THREE.PointLight(0xff0040, 2, 50);
      light.castShadow = true;

      return light;
    }

    case LIGHT_TYPES.HEMI:
      return new THREE.AmbientLight(0xffffff, intensity);
    case LIGHT_TYPES.SPOT: {
      const light = new THREE.SpotLight(0xffffff, intensity);

      light.angle = Math.PI / 4;
      light.penumbra = 0.1;
      light.decay = 2;
      light.distance = 200;

      // light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.camera.near = 10;
      light.shadow.camera.far = 200;
      light.shadow.focus = 1;

      return light;
    }
    case LIGHT_TYPES.AMBIENT:
      return new THREE.AmbientLight(0xffffff, intensity);
    default:
      return new THREE.DirectionalLight(0xffffff, intensity);
  }
}

export function getLight(type, position, intensity) {
  const light = getLightByType(type, intensity);
  const sphere = new THREE.SphereGeometry(0.1, 16, 8);

  light.position.set(...position);

  light.add(
    new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xff0040 }))
  );

  return light;
}

export const setSkyBox = (scene: THREE.Mesh, src: string) => {
  const panoSphereGeo = new THREE.SphereGeometry(100, 256, 256);
  const panoSphereMat = new THREE.MeshStandardMaterial({
    side: THREE.BackSide,
    displacementScale: -4.0,
  });
  const sphere = new THREE.Mesh(panoSphereGeo, panoSphereMat);
  const manager = new THREE.LoadingManager();
  const loader = new THREE.TextureLoader(manager);

  loader.load(src, function (texture) {
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    sphere.material.map = texture;
  });

  manager.onLoad = function () {
    scene.add(sphere);
  };
};

export function createMenu() {
  // const loader = new THREE.TextureLoader();
  const group = new THREE.Group();

  MENU_CONFIG.forEach(({ position, size, background }) => {
    // const texture = loader.load(image);
    const material = new THREE.MeshBasicMaterial({
      color: background,
      side: THREE.DoubleSide,
    });
    const geometry = new THREE.PlaneGeometry(...size);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(...position);

    group.add(mesh);
  });

  return group;
}

export function setGUI({ globalState, model, renderer, camera, observer }) {
  const gui = new GUI({ width: 300 });

  const cubeFolder = gui.addFolder('Cube');
  cubeFolder.add(model.position, 'x', -2, 3, 0.01);
  cubeFolder.add(model.position, 'y', -2, 3, 0.01);
  cubeFolder.add(model.position, 'z', -2, 3, 0.01);
  cubeFolder.open();

  gui.domElement.style.visibility = 'hidden';

  const group = new InteractiveGroup(renderer, camera);

  const mesh = new HTMLMesh(gui.domElement);
  mesh.position.x = -0.75;
  mesh.position.y = 1.5;
  mesh.position.z = -0.5;
  mesh.rotation.y = Math.PI / 4;
  mesh.scale.setScalar(2);
  group.add(mesh);

  // Add stats.js
  const stats = new Stats();
  stats.dom.style.width = '80px';
  stats.dom.style.height = '48px';
  document.body.appendChild(stats.dom);

  const statsMesh = new HTMLMesh(stats.dom);
  statsMesh.position.x = -0.65;
  statsMesh.position.y = 1.7;
  statsMesh.position.z = -0.5;
  statsMesh.rotation.y = Math.PI / 4;
  statsMesh.scale.setScalar(2.5);
  group.add(statsMesh);

  observer.add(group);

  globalState.mesh = mesh;
  globalState.statsMesh = statsMesh;
}
