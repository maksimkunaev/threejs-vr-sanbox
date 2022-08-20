import * as THREE from 'three';

export function getFloor(color, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      color,
      // depthWrite: false,
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

export enum LIGHT_TYPES {
  PHONG,
  HEMI,
  DIRECTIONAL,
  SPOT,
  AMBIENT,
}

export const MENU_CONFIG = [
  // {
  //     image: '/public/sunset-text.png',
  //     position: [-2, 1, -1],
  //     size: [2, 1, 0],
  //     name: LIGHT_TYPES.DIRECTIONAL,
  //     background: 0xff0000,
  // },
  // {
  //     image: '/public/street-text.png',
  //     position: [2, 1, -1],
  //     size: [2, 1, 0],
  //     name: LIGHT_TYPES.HEMI,
  //     background: 0x00ff00,
  // },
  {
    image: '/public/logo512.png',
    position: [6, 1, -1],
    size: [2, 1, 0],
    name: LIGHT_TYPES.PHONG,
    background: 0xffffff,
  },
];

export function getLightByType(type: LIGHT_TYPES) {
  switch (type) {
    case LIGHT_TYPES.PHONG: {
      const light = new THREE.PointLight(0xff0040, 2, 50);
      light.castShadow = true;

      return light;
    }

    case LIGHT_TYPES.HEMI:
      return new THREE.AmbientLight(0xffffff, 1);
    case LIGHT_TYPES.SPOT: {
      const light = new THREE.SpotLight(0xffffff, 1);

      light.angle = Math.PI / 4;
      light.penumbra = 0.1;
      light.decay = 2;
      light.distance = 200;

      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.camera.near = 10;
      light.shadow.camera.far = 200;
      light.shadow.focus = 1;

      return light;
    }
    case LIGHT_TYPES.AMBIENT:
      return new THREE.AmbientLight(0xffffff, 0.1);
    default:
      return new THREE.DirectionalLight(0xffffff);
  }
}

export function getLight(type, position) {
  const light = getLightByType(type);
  const sphere = new THREE.SphereGeometry(0.1, 16, 8);

  light.position.set(...position);

  light.add(
    new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xff0040 }))
  );

  return light;
}

const addSkyBox = (scene: THREE.Mesh, src: string) => {
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
