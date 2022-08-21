import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import * as H from './helpers.js';
import Controllers from './controllers.js';
import Teleportation from './teleport.js';

const { isVR } = H;

type Params = Record<string, any> & {
  // onReady: (DS: DefaultScene) => void;
};

export default class DefaultScene {
  params: Params;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  controllers: Controllers;
  teleportation: Teleportation;
  observer: THREE.Mesh;
  orbitControls: OrbitControls;
  gltfLoader: GLTFLoader;

  constructor(params: Params = {}) {
    this.params = params;

    this.initRenderer(params.renderer);
    this.initScene();
    this.initObserver();
    this.initCamera();
    this.initOrbitControls();
    this.initControllers(params);
    this.initAxesHelper(params.axesHelper);
    this.initGridHelper(params.gridHelper);
    this.initTeleportation(params.teleportation);

    params.onReady?.(this);

    if (isVR) {
      this.renderer.xr.enabled = true;
      document.body.appendChild(VRButton.createButton(this.renderer));
    }

    this.renderer.setAnimationLoop(this.update);
  }

  private initRenderer(params: any = {}) {
    const {
      configure,
      pixelRatio = window.devicePixelRatio,
      size = H.getDefaultSize(),
      ...rest
    } = params;

    this.renderer = new THREE.WebGLRenderer(rest);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(size.width, size.height);
    // this.renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(this.renderer.domElement);

    configure?.(this.renderer);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.params.scene?.configure?.(this.scene);
  }

  private initObserver() {
    const { configure } = this.params.observer || {};

    this.observer = H.createObserver();
    configure?.(this.observer);

    this.scene.add(this.observer);
  }

  private initOrbitControls(params = this.params.orbitControls) {
    if (!params) return;

    const { configure } = (typeof params === 'object' && params) || {};

    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    // this.orbitControls.target.set(this.observer.geometry.vertices);
    this.orbitControls.update();

    configure?.(this.orbitControls);
  }

  private initCamera(params = this.params.camera) {
    if (typeof params === 'function') {
      this.camera = params();
      return;
    }

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );

    this.camera.position.y = 2;
    // this.camera.position.set(1.2, 3, 14);
    // this.camera.lookAt(0, 0, 0);

    this.observer.add(this.camera);
  }

  private initControllers(params) {
    if (!params) return;

    this.controllers = new Controllers(this, params);
  }

  private initAxesHelper(params) {
    if (!params) return;

    this.scene.add(new THREE.AxesHelper(100));
  }

  private initGridHelper(params) {
    if (!params) return;

    const grid = new THREE.GridHelper(15, 15, 0x888888, 0x444444);
    this.scene.add(grid);
  }

  private initTeleportation(params) {
    if (!params) return;

    this.teleportation = new Teleportation(this, params);
  }

  loadModel({ url, onProgress, onError, position, castShadow, scale }) {
    if (!this.gltfLoader) this.gltfLoader = new GLTFLoader();

    return new Promise(resolve => {
      this.gltfLoader.load(
        url,
        gltf => {
          if (position) gltf.scene.position.set(...position);
          if (scale) gltf.scene.scale.set(...scale);
          if (castShadow) gltf.scene.castShadow = true;

          const obj = gltf.scene;

          this.scene.add(obj);
          resolve(obj);
        },
        onProgress,
        onError
      );
    });
  }

  loadAudio({ url, targetMesh, listenerMeshes, onLoad }) {
    const listener = new THREE.AudioListener();
    const sound = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load(url, buffer => {
      sound.setBuffer(buffer);
      targetMesh.add(sound);
      onLoad(sound, listener);
      listenerMeshes?.forEach(mesh => mesh.add(listener));
    });
  }

  setAspect() {
    if (H.needUpdateRenderSize(this.renderer)) {
      const { clientWidth, clientHeight } = this.renderer.domElement;

      this.renderer.setSize(clientWidth, clientHeight, false);

      this.camera.aspect = clientWidth / clientHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  update = time => {
    time *= 0.0005;

    this.setAspect();
    this.params.update(time);
    this.controllers.update();
    this.teleportation?.update();

    this.renderer.render(this.scene, this.camera);

    // if (!isVR) requestAnimationFrame(this.update);
  };
}
