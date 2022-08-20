import * as THREE from 'three';

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

  const bezierCurve3 = new THREE.CubicBezierCurve3(
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
    new THREE.Vector3(x2, y2, z2)
  );

  return bezierCurve3;
}

export function getIntersections(controller, objects, raycaster, tempMatrix) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  return raycaster.intersectObjects(objects, true); // TODO: optimize recursive search
}

export function needUpdateRenderSize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;

  return needResize;
}
