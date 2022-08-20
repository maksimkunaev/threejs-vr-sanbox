import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import * as H from './helpers.js';
import Controllers from './controllers.js';
import Teleportation from './teleport.js';

type Params = Record<string, any> & {
  // onReady: (DS: DefaultScene) => void;
};

export default class DefaultScene {
  isXREnabled = true; //'xr' in window.navigator;

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

    this.initRenderer();
    this.initScene();
    this.initObserver();
    this.initCamera();
    this.initOrbitControls();
    this.initControllers(params.controllers);
    this.initTeleportation(params.teleportation);

    params.onReady?.(this);

    if (this.isXREnabled) {
      this.renderer.xr.enabled = true;
      document.body.appendChild(VRButton.createButton(this.renderer));
    }

    if (this.isXREnabled) {
      this.renderer.setAnimationLoop(this.update);
    }

    if (!this.isXREnabled) {
      requestAnimationFrame(this.update);
    }
  }

  initRenderer() {
    const {
      configure,
      pixelRatio,
      size = H.getDefaultSize(),
      ...rest
    } = this.params.renderer || {};

    this.renderer = new THREE.WebGLRenderer(rest);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(size.width, size.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    configure?.(this.renderer);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.params.scene?.configure?.(this.scene);
  }

  initObserver() {
    const { configure } = this.params.observer || {};

    this.observer = H.createObserver();
    configure?.(this.observer);

    this.scene.add(this.observer);
  }

  initOrbitControls(params = this.params.orbitControls) {
    if (!params) return;

    const { configure } = (typeof params === 'object' && params) || {};

    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    this.orbitControls.target.set(0, 1.6, 0);
    this.orbitControls.update();

    configure?.(this.orbitControls);
  }

  initCamera(params = this.params.camera) {
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
    this.camera.position.set(1.2, 3, 14);
    this.camera.lookAt(0, 0, 0);

    this.observer.add(this.camera);
  }

  private initControllers(params) {
    this.controllers = new Controllers(this.renderer, this.observer, params);
  }

  private initTeleportation(params) {
    if (!params) return;

    this.teleportation = new Teleportation({
      scene: this.scene,
      observer: this.observer,
      controllers: this.controllers,
      params,
    });
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

    if (!this.isXREnabled) requestAnimationFrame(this.update);

    this.renderer.render(this.scene, this.camera);
  };
}
