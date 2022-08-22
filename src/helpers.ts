import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const pointer = { x: 0, y: 0 };
export const getDefaultSize = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

export function createObserver() {
  const height = 0.05;
  const geometry = new THREE.ConeGeometry(0.2, height);
  const material = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
    roughness: 0.7,
    metalness: 0.0,
  });
  const observer = new THREE.Mesh(geometry, material);

  observer.position.y = height / 2 + 0.1;

  return observer;
}

// TODO optimize (just update every loop - not create avery loop iteraetion)
export function getCubicCurve3(x0, y0, z0, x2, y2, z2) {
  const getMiddlePoint = (first, last) => {
    return first + (last - first) / 2;
  };

  return [
    new THREE.Vector3(x0, y0, z0),
    new THREE.Vector3(
      getMiddlePoint(x0, x2),
      getMiddlePoint(y0, y2) + 1,
      getMiddlePoint(z0, z2)
    ),
    new THREE.Vector3(
      getMiddlePoint(x0, x2),
      getMiddlePoint(y0, y2) + 1,
      getMiddlePoint(z0, z2)
    ),
    new THREE.Vector3(x2, y2, z2),
  ];
}

export function loadModel({
  url,
  onProgress,
  onError,
  position,
  castShadow,
  scale,
}: {
  url: string;
  onProgress?: (arg: unknown) => void;
  onError?: (arg: unknown) => void;
  position: number[];
  castShadow?: boolean;
  scale?: number[];
}) {
  const gltfLoader = new GLTFLoader();

  return new Promise(resolve => {
    gltfLoader.load(
      url,
      gltf => {
        if (position) gltf.scene.position.set(...position);
        if (scale) gltf.scene.scale.set(...scale);
        if (castShadow) gltf.scene.castShadow = true;

        resolve(gltf.scene);
      },
      onProgress,
      onError
    );
  });
}
