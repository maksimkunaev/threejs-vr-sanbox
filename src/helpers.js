import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

async function getMesh({
  radius = 1,
  color = 'blue',
  side = THREE.FrontSide,
  segmentCounts = 30,
  map,
}) {
  const geometry = new THREE.SphereGeometry(
    radius,
    segmentCounts,
    segmentCounts
  );
  const loader = new THREE.TextureLoader();
  const material = new THREE.MeshStandardMaterial({
    color,
    side,
  });

  if (map) material.map = loader.load(map);

  const mesh = new THREE.Mesh(geometry, material);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function addObserver(mesh) {
  const height = 0.05;

  const geometry = new THREE.ConeGeometry(0.2, height, 18);
  const material = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
    roughness: 0.7,
    metalness: 0.0,
  });
  const observer = new THREE.Mesh(geometry, material);
  observer.position.y = height / 2 + 0.1;

  mesh.add(observer);

  return observer;
}

function initControllers({ scene, renderer, onSelectStart, onSelectEnd }) {
  const controller1 = renderer.xr.getController(0);
  const controller2 = renderer.xr.getController(1);

  if (onSelectStart) {
    controller1.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectstart', onSelectStart);
  }

  if (onSelectEnd) {
    controller1.addEventListener('selectend', onSelectEnd);
    controller2.addEventListener('selectend', onSelectEnd);
  }

  scene.add(controller1);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  const grip1 = renderer.xr.getControllerGrip(0);
  const grip2 = renderer.xr.getControllerGrip(1);

  grip1.add(controllerModelFactory.createControllerModel(grip1));
  grip2.add(controllerModelFactory.createControllerModel(grip2));

  scene.add(grip1);
  scene.add(grip2);

  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);
  const line = new THREE.Line(geometry);

  line.name = 'line';
  line.scale.z = 50;

  controller1.add(line.clone());
  controller2.add(line.clone());

  return {
    controller1,
    controller2,
    grip1,
    grip2,
  };
}

function initOrbits(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1.6, 0);
  controls.update();
}

function updateText({ text, scene, oldTextMesh, font }) {
  scene.remove(oldTextMesh);
  const textMesh = addTextMesh({ text, scene, font });
  scene.add(textMesh);
  textMesh.rotation.y = -3.2;
  textMesh.position.y = 1.6;
  textMesh.position.x = 1;
  textMesh.position.z = 1;

  return textMesh;
}

function loadFont(url) {
  return new Promise(resolve => {
    const loader = new FontLoader();
    const font = loader.load(
      url,
      font => resolve(font),
      xhr => console.log((xhr.loaded / xhr.total) * 100 + '% loaded'),
      err => console.log(err)
    );
  });
}

function addTextMesh({ text = 'Text example', height = 1, size = 1, font }) {
  const textGeometry = new TextGeometry(text, {
    font: font,
    size: 0.1,
    height: 0.1,
  });

  textGeometry.computeBoundingBox();

  const textMaterial = new THREE.MeshPhongMaterial({ color: '#fff' });
  textMaterial.flatShading = true;

  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.receiveShadow = true;
  textMesh.castShadow = true;

  return textMesh;
}

function setTexture({ maps, material }) {
  const textureLoader = new THREE.TextureLoader();

  maps.map &&
    textureLoader.load(maps.map, function (map) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      map.encoding = THREE.sRGBEncoding;
      material.map = map;
      material.needsUpdate = true;
    });

  maps.bump &&
    textureLoader.load(maps.bump, function (map) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      material.bumpMap = map;
      material.needsUpdate = true;
    });

  maps.roughness &&
    textureLoader.load(maps.roughness, function (map) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      material.roughnessMap = map;
      material.needsUpdate = true;
    });
}

// TODO optimize (just update every loop - not create avery loop iteraetion)
function getCubicBezierCurve3(x0, y0, z0, x2, y2, z2) {
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

function getIntersections(controller, objects, raycaster, tempMatrix) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  // TODO: optimize using `raycaster.intersectObject` to stop on first intersection
  return raycaster.intersectObjects(objects, true);
}

function needUpdateRenderSize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;

  if (needResize) {
    renderer.setSize(width, height, false);
  }

  return needResize;
}

const generateBoxes = count => {
  const boxes = [];
  for (let i = 0; i < count; i++) {
    const box = {
      position: [
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
      ],
      size: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
      color: Math.random() * 0xffffff,
    };
    boxes.push(box);
  }
  return boxes;
};

export default {
  getMesh,
  addObserver,
  initControllers,
  initOrbits,
  updateText,
  loadFont,
  addTextMesh,
  setTexture,
  getCubicBezierCurve3,
  getIntersections,
  needUpdateRenderSize,
  generateBoxes,
};
