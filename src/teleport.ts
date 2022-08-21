import * as THREE from 'three';
import * as H from './helpers.js';
import DefaultScene from './';

const { isVR } = H;

const getTeleportTarget = () => {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.2, 18),
    new THREE.MeshPhongMaterial({ color: '#185ADB' })
  );
  mesh.rotation.x = -Math.PI / 2;

  return mesh;
};

export default class Teleportation {
  _: DefaultScene;
  params;

  targets: THREE.Object3D[] = [];
  target = getTeleportTarget();
  curve;
  progressCurve;
  line = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xff0000 })
  );
  gamepadReady = false;
  isGeometryVisible = false;
  isThrottling = false;
  step = 0.05;
  rotationStep = 0.03;
  rotationThreshold = 0.15;
  progress = 0;
  controllerIndex = 1;

  constructor(_, params) {
    this._ = _;
    this.params = params;

    this.curve = new THREE.CubicBezierCurve3(...this.getCurveVector());
    this.updateTargets(params.targets);

    _.controllers.onGamepadConnected(
      this.controllerIndex,
      () => (this.gamepadReady = true)
    );
  }

  fly = () => {
    if (this.isGeometryVisible && !this.isThrottling) {
      this.progressCurve = this.curve.clone();
      this.progress = this.step;
    }
  };

  getGamepad() {
    return this._.controllers.gamepads[this.controllerIndex]; // right gamepad
  }

  updateTargets(targets: THREE.Object3D[]) {
    this.targets = targets;
    this.subscribeToTargets();
  }

  addTargets(targets: THREE.Object3D[]) {
    this.targets = this.targets.concat(targets);
  }

  subscribeToTargets() {
    const { controllers } = this._;
    const index = controllers.getIndex(this.controllerIndex);

    controllers.off(index, 'selectstart', this.fly);
    controllers.on(index, 'selectstart', this.fly, this.targets);
  }

  getCurveVector() {
    return H.getCubicCurve3(
      this._.observer.position.x,
      this._.observer.position.y,
      this._.observer.position.z,
      this.target.position.x,
      this.target.position.y,
      this.target.position.z
    );
  }

  showTeleportGeometry = () => {
    if (this.isGeometryVisible) return;
    this.isGeometryVisible = true;

    isVR && this._.scene.add(this.line);
    this._.scene.add(this.target);
  };

  hideTeleportGeometry = () => {
    if (!this.isGeometryVisible) return;
    this.isGeometryVisible = false;

    isVR && this._.scene.remove(this.line);
    this._.scene.remove(this.target);
  };

  updateTargetGeometry({ point }) {
    this.target.position.set(point.x, point.y + 0.02, point.z);
  }

  updateLineGeometry() {
    const v = this.getCurveVector();

    this.curve.v0 = v[0];
    this.curve.v1 = v[1];
    this.curve.v2 = v[2];
    this.curve.v3 = v[3];

    const points = this.curve.getPoints(50);

    this.line.geometry.setFromPoints(points);
    this.line.geometry.buffersNeedUpdate = true; // TODO: remove this
  }

  updateGeometry = () => {
    if (isVR) {
      if (!this.gamepadReady) return;

      const [, , , yAmplitide] = this.getGamepad().axes;

      if (yAmplitide > -0.5) {
        this.hideTeleportGeometry();
        return;
      }
    }

    const intersected = this._.controllers.getIntersections(
      this.controllerIndex,
      this.targets
      // this._.scene.children
    )[0];

    if (intersected) {
      // if (this.targets.includes(intersected?.object)) {
      this.updateTargetGeometry(intersected);
      this.updateLineGeometry();
      this.showTeleportGeometry();
    } else {
      this.hideTeleportGeometry();
    }
  };

  updateObserverPosition = () => {
    if (this.progress >= 1) {
      this.progress = 0;
      return;
    }

    const points = this.progressCurve.getPoint(this.progress);

    // console.log('points', points);

    this._.observer.position.copy(points);
    this.progress += this.step;
  };

  updateObserverRotation() {
    if (isVR) {
      if (!this.gamepadReady) return;

      const { buttons, axes } = this.getGamepad();
      const stickButton = buttons?.[3];

      if (!stickButton?.touched) return;

      const [, , xAmplitude] = axes;
      const { rotation } = this._.observer;

      if (xAmplitude > this.rotationThreshold) rotation.y -= this.rotationStep;
      if (xAmplitude < -this.rotationThreshold) rotation.y += this.rotationStep;

      return;
    }

    const { pressedKeys } = this._.controllers;

    if (pressedKeys.a) this._.observer.rotation.y += this.rotationStep;
    if (pressedKeys.d) this._.observer.rotation.y -= this.rotationStep;
  }

  update() {
    // TODO: support selecting next target when flying
    this.updateGeometry();

    this.updateObserverRotation();
    if (this.progress > 0) this.updateObserverPosition();
  }
}
