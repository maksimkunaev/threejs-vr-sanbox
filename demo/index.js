import * as THREE from 'three';
import { GUI } from 'dat.gui';

import DefaultScene from '../src/index.js';

function getFloor(color, x, y, z) {
  const floorMesh = new THREE.Mesh(
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
  floorMesh.rotation.x = -Math.PI / 2.0;
  floorMesh.receiveShadow = true;
  floorMesh.position.x = x || 0;
  floorMesh.position.z = z || 0;
  floorMesh.position.y = y || 0;

  return floorMesh;
}

function getPointLight(position) {
  const sphere = new THREE.SphereGeometry(0.1, 16, 8);

  const light = new THREE.PointLight(0xff0040, 2, 50);
  light.add(
    new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xff0040 }))
  );
  light.position.set(position[0], position[1], position[2]);
  light.castShadow = true;

  return light;
}

function createMenu(instance) {
  const loader = new THREE.TextureLoader();
  const menuObjects = [
    {
      image: '/public/sunset-text.png',
      position: [-2, 1, -3],
      size: [2, 1, 0],
      name: 'sunset',
    },
    {
      image: '/public/street-text.png',
      position: [2, 1, -3],
      size: [2, 1, 0],
      name: 'street',
    },
  ].map(({ image, position, size, name }) => {
    const texture = loader.load(image);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(size[0], size[1] * 0.5);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(0, 0, 0);
    mesh.position.set(...position);

    instance.scene.add(mesh);

    return mesh;
  });

  let lastIntersected;

  function onMenuHover(obj) {
    console.log('onMenuHover', obj);

    if (obj) {
      if (lastIntersected !== obj.object) {
        lastIntersected = obj.object;
        lastIntersected.currentHex = lastIntersected.material.color.getHex();
        // set hover state
        lastIntersected.material.color.setHex(0xff0000);
      }
    } else {
      if (lastIntersected) {
        // return to original color
        lastIntersected.material.color.setHex(lastIntersected.currentHex);
        lastIntersected = null;
      }
    }
  }

  instance.subscribeIntersectObjects(menuObjects, onMenuHover);
  // instance.unsubscribeIntersectObjects(onMenuHover)
}

let pointLight;

new DefaultScene({
  canvas: document.querySelector('canvas'),
  configureRenderer(renderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
  },
  configureScene(scene) {
    scene.add(new THREE.AxesHelper(100));
    scene.background = new THREE.Color('#0A1931');
    // scene.fog = new THREE.Fog('#545454e8', 0, 35);
  },
  onReady(DS) {
    const { scene } = DS;

    // floor
    const floor = getFloor('#046582', 0, 0, 0);
    scene.add(floor);
    DS.setObjectsForTeleport([floor]);

    // light
    pointLight = getPointLight([0, 10, 0]);
    scene.add(pointLight);

    const gui = new GUI();
    const cubeFolder = gui.addFolder('Cube');
    cubeFolder.add(pointLight.position, 'x', 0, Math.PI * 4);
    cubeFolder.add(pointLight.position, 'y', 0, Math.PI * 4);
    cubeFolder.add(pointLight.position, 'z', 0, Math.PI * 4);
    cubeFolder.open();

    createMenu(DS);

    DS.initOrbits();

    DS.loadModel({ url: '/360_sphere_robot/scene.gltf' });

    DS.addAudio({
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
    pointLight.position.x = 3 * Math.sin(time);
  },
});
