import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import helpers from './helpers.js';
import Controllers from './controllers.js';

const { getDefaultSize, addObserver, initOrbits, needUpdateRenderSize } =
  helpers;

export default class DefaultScene {
  isXREnabled = 'xr' in window.navigator;

  updaters = [];
  callbacks = {
    onSelectStart: [],
    onSelectEnd: [],
    onSticksEvents: [],
  };

  constructor(params = {}) {
    this.params = params;

    this.initRenderer();
    this.initScene();
    this.initObserver();
    this.initOrbitControls();
    this.initCamera();

    this.controllers = new Controllers(this.scene, this.renderer);

    params.onReady?.(this);

    // run //

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
      size = getDefaultSize(),
      ...rest
    } = this.params.render || {};

    this.renderer = new THREE.WebGLRenderer(rest);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(size.width, size.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    configure?.(this.renderer);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initObserver() {
    const { configure } = this.params.observer || {};

    this.observer = addObserver(new THREE.Object3D());
    this.observer.position.set(0, 0, 0);
    configure?.(this.observer);

    this.scene.add(this.observer);
  }

  initOrbitControls(params = this.params.orbits) {
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

    this.camera = new THREE.PerspectiveCamera(75, 2, 0.1, 120);
    this.camera.position.set(1.2, 3, 14);
    this.camera.lookAt(0, 0, 0);
  }

  loadModel({ url, onSuccess, onProgress, onError, position, scale }) {
    if (!this.gltfLoader) this.gltfLoader = new GLTFLoader();

    this.gltfLoader.load(
      url,
      gltf => {
        const obj = new THREE.Object3D();

        if (position) gltf.scene.position.set(...position);
        if (scale) gltf.scene.scale.set(...scale);

        obj.add(gltf.scene);
        this.scene.add(obj);

        onSuccess?.(gltf);
      },
      onProgress,
      onError
    );
  }

  addAudio({ url, targetMesh, listenerMeshes, onLoad }) {
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
    if (needUpdateRenderSize(this.renderer)) {
      const { clientWidth, clientHeight } = this.params.canvas;
      this.camera.aspect = clientWidth / clientHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  onSelectStart = e => {
    this.callbacks.onSelectStart?.forEach(callback => callback(e));
  };

  onSelectEnd = e => {
    this.callbacks.onSelectEnd?.forEach(callback => callback(e));
  };

  checkSticksPressed = () => {
    const stickButtonLeft = this?.gamepad1?.buttons[3];
    const stickButtonRight = this?.gamepad2?.buttons[3];
    const axesLeft = this?.gamepad1?.axes;
    const axesRight = this?.gamepad2?.axes;

    this.updateObserverRotation(stickButtonLeft, axesLeft);
    this.callbacks.onSticksEvents?.forEach(callback =>
      callback(stickButtonRight, axesRight)
    );
  };

  updateObserverRotation = (stickButton, axes) => {
    if (stickButton?.touched) {
      const [, , xAmplitude] = axes;

      if (xAmplitude > 0.15) {
        this.observer.rotation.y -= 0.015;
      }

      if (xAmplitude < -0.15) {
        this.observer.rotation.y += 0.015;
      }
    }
  };

  update = time => {
    time *= 0.0005;

    this.setAspect();
    this.checkSticksPressed();

    this.params.update(time);
    this.intersectListeners.forEach(l => l());
    this.updaters.forEach(u => u(time));

    if (!this.isXREnabled) {
      requestAnimationFrame(this.update);
    }

    this.renderer.render(this.scene, this.camera);
  };
}
