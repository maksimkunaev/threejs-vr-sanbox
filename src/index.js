import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import helpers from './helpers.js';

const {
  addObserver,
  initControllers,
  initOrbits,
  getIntersections,
  needUpdateRenderSize,
} = helpers;

export default class DefaultScene {
  isXREnabled = 'xr' in window.navigator;

  controller1 = null;
  controller2 = null;
  gamepad1 = null;
  gamepad2 = null;
  boxes = [];
  planes = [];
  model = {};
  intersectListeners = new Map();
  updaters = []
  callbacks = {
    onSelectStart: [],
    onSelectEnd: [],
    onSticksEvents: [],
  }

  constructor(params = {}) {
    this.params = params;

    this.renderer = this.getRenderer();
    params.configureRenderer?.(this.renderer);

    this.scene = this.getScene(this.renderer);
    params.configureScene?.(this.scene);

    this.observer = this.getObserver();
    this.scene.add(this.observer);

    // camera
    this.camera = params.camera || this.getCamera();
    this.observer.add(this.camera);

    // create raycaster
    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();

    const { controller1, controller2, grip1, grip2 } = initControllers({
      scene: this.observer,
      onSelectStart: this.onSelectStart,
      onSelectEnd: this.onSelectEnd,
      renderer: this.renderer,
    });

    grip1.addEventListener('connected', e => {
      this.gamepad1 = e.data.gamepad;
    });

    grip2.addEventListener('connected', e => {
      console.log('grip2');
      this.gamepad2 = e.data.gamepad;
    });

    this.observer.add(controller1);
    this.observer.add(controller2);

    this.controller1 = controller1;
    this.controller2 = controller2;

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

  initOrbits = () => initOrbits(this.camera, this.renderer.domElement);

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

  subscribeIntersectObjects(objects, callback) {
    this.intersectListeners.set(callback, () => {
      const intersections = getIntersections(
        this.controller2,
        objects,
        this.raycaster,
        this.tempMatrix
      );

      if (intersections[0]) callback(intersections[0]);
    });
  }

  unsubscribeIntersectObjects(callback) {
    this.intersectListeners.delete(callback);
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

  getStage() {
    return new THREE.Group();
  }

  getRenderer() {
    const { canvas } = this.params;
    return new THREE.WebGLRenderer({ canvas, antialias: true });
  }

  getScene(renderer) {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;

    return new THREE.Scene();
  }

  getObserver() {
    const observer = addObserver(new THREE.Object3D());
    observer.position.set(0, 0, 0);

    return observer;
  }

  getCamera() {
    const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 120);
    camera.position.set(1.2, 3, 14);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  checkSticksPressed = () => {
    const stickButtonLeft = this?.gamepad1?.buttons[3]
    const stickButtonRight = this?.gamepad2?.buttons[3]
    const axesLeft = this?.gamepad1?.axes;
    const axesRight = this?.gamepad2?.axes;
    
    this.updateObserverRotation(stickButtonLeft, axesLeft);
    this.callbacks.onSticksEvents?.forEach(callback => callback(stickButtonRight, axesRight));
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