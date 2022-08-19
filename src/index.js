import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import helpers from './helpers.js';

const {
  addObserver,
  initControllers,
  initOrbits,
  getCubicBezierCurve3,
  getIntersections,
  needUpdateRenderSize,
} = helpers;

export default class DefaultScene {
  isXREnabled = 'xr' in window.navigator;

  controller1 = null;
  controller2 = null;
  gamepad1 = null;
  gamepad2 = null;
  moving = false;
  progress = 0;
  boxes = [];
  planes = [];
  ringMesh = null;
  curveMesh = null;
  bezierCurve = null;
  model = {};
  objectsForTeleportation = [];
  intersectListeners = new Map();

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

    // ring teleportation mesh
    this.ringMesh = this.getRing();
    this.scene.add(this.ringMesh);

    // curve teleportation mesh
    this.curveMesh = this.getCurveMesh();
    this.scene.add(this.curveMesh);

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

  setObjectsForTeleport(objects) {
    this.objectsForTeleportation.push(...objects);
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
      console.log('objects', objects);

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

  updateBezierCurveAndRing() {
    const { ringMesh, observer } = this;

    if (this.moving) return;

    const intersects = getIntersections(
      this.controller1,
      this.objectsForTeleportation,
      this.raycaster,
      this.tempMatrix
    );
    const intersected = intersects[0];

    if (!intersected) return;

    const newBezierCurve = getCubicBezierCurve3(
      observer.position.x,
      observer.position.y,
      observer.position.z,
      ringMesh.position.x,
      ringMesh.position.y,
      ringMesh.position.z
    );

    this.updateCurvePosition(newBezierCurve);
    this.updateRingPosition(intersected);
  }

  updateRingPosition({ point }) {
    this.ringMesh.position.set(point.x, point.y + 0.02, point.z);
  }

  updateCurvePosition(newBezierCurve) {
    this.curveMesh.geometry = new THREE.BufferGeometry().setFromPoints(
      newBezierCurve.getPoints(50)
    );
    this.curveMesh.geometry.buffersNeedUpdate = true;
    this.bezierCurve = newBezierCurve;
  }

  moveObserver = () => {
    if (this.moving && this.bezierCurve) {
      if (this.progress >= 1) {
        this.progress = 0;
        this.moving = false;
        this.bezierCurve = null;
        return;
      }

      this.observer.position.copy(this.bezierCurve.getPointAt(this.progress));
      this.progress += 0.05;
    }
  };

  onSelectStart = e => {
    console.log(e);
    if (e.data.handedness === 'right') {
      this.moving = true;
    }
  };

  onSelectEnd = e => {};

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

  getRing() {
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.2, 18),
      new THREE.MeshPhongMaterial({ color: '#185ADB' })
    );
    ringMesh.rotation.x = -Math.PI / 2;

    return ringMesh;
  }

  getCurveMesh() {
    const bezierCurve = getCubicBezierCurve3(0, 0, 0, -5, -5, -5);
    const curveMesh = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(bezierCurve.getPoints(50)),
      new THREE.LineBasicMaterial({ color: 0xff0000 })
    );

    return curveMesh;
  }

  updateObserverRotation = () => {
    // TODO: move to this.controller.onstickmove

    const joystick = this?.gamepad1?.buttons[3];

    if (joystick && joystick.touched) {
      const { axes } = this.gamepad1;
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
    this.updateBezierCurveAndRing();
    this.moveObserver();
    this.updateObserverRotation();

    this.params.update(time);
    this.intersectListeners.forEach(l => l());

    if (!this.isXREnabled) {
      requestAnimationFrame(this.update);
    }

    this.renderer.render(this.scene, this.camera);
  };
}
