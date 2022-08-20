import * as THREE from 'three';
import Controllers from './controllers.js';
import * as H from './helpers.js';

const getTeleportTarget = () => {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.2, 18),
    new THREE.MeshPhongMaterial({ color: '#185ADB' })
  );
  mesh.rotation.x = -Math.PI / 2;

  return mesh;
};

const getRay = () => {
  const curve = H.getCubicCurve3(0, 0, 0, -5, -5, -5);

  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)),
    new THREE.LineBasicMaterial({ color: 0xff0000 })
  );
};

export default class Teleportation {
  params;
  targets: THREE.Object3D[] = [];

  scene: THREE.Scene;
  observer: THREE.Object3D;
  controllers: Controllers;
  raycaster = new THREE.Raycaster();
  tempMatrix = new THREE.Matrix4();

  ray = null;
  curve = null;
  target = null;
  gamepadReady = false;
  step = 0.05;
  rotationStep = 0.03;
  rotationThreshold = 0.15;
  progress = 0;
  controllerIndex = 1;

  constructor({ scene, observer, controllers, params }) {
    this.scene = scene;
    this.observer = observer;
    this.controllers = controllers;

    this.params = params;
    this.updateTargets(params.targets);

    controllers.onGamepadConnected(
      this.controllerIndex,
      () => (this.gamepadReady = true)
    );
  }

  fly = () => {
    if (this.ray && this.target) {
      this.progress += this.step;
    }
  };

  getGamepad() {
    return this.controllers.gamepads[this.controllerIndex]; // right gamepad
  }

  updateTargets(targets: THREE.Object3D[]) {
    this.targets = targets;
    this.subscribeToTargets();
  }

  addTargets(targets: THREE.Object3D[]) {
    this.targets = this.targets.concat(targets);
  }

  subscribeToTargets() {
    this.controllers.off(this.controllerIndex, 'selectstart', this.fly);
    this.controllers.on(
      this.controllerIndex,
      'selectstart',
      this.fly,
      this.targets
    );
  }

  updateTeleportGeometry = () => {
    const intersected = H.getIntersections(
      this.controllers.controllers[this.controllerIndex],
      this.targets,
      this.raycaster,
      this.tempMatrix
    )[0];

    if (!intersected) return;

    this.updateRayGeometry();
    this.updateTargetGeometry(intersected);
  };

  updateRayGeometry() {
    const curve = H.getCubicCurve3(
      this.observer.position.x,
      this.observer.position.y,
      this.observer.position.z,
      this.target.position.x,
      this.target.position.y,
      this.target.position.z
    );
    const points = curve.getPoints(50);

    this.ray.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.ray.geometry.buffersNeedUpdate = true;

    this.curve = curve;
  }

  updateTargetGeometry({ point }) {
    this.target.position.set(point.x, point.y + 0.02, point.z);
  }

  updateObserverPosition = () => {
    if (this.progress >= 1) {
      this.progress = 0;
      return;
    }

    this.observer.position.copy(this.curve.getPointAt(this.progress));
    this.progress += this.step;
  };

  updateObserverRotation() {
    if (!this.gamepadReady) return;

    const { buttons, axes } = this.getGamepad();
    const stickButton = buttons?.[3];

    if (!stickButton?.touched) return;

    const [, , xAmplitude] = axes;
    const { rotation } = this.observer;

    if (xAmplitude > this.rotationThreshold) rotation.y -= this.rotationStep;
    if (xAmplitude < -this.rotationThreshold) rotation.y += this.rotationStep;
  }

  showTeleportGeometry = () => {
    if (this.ray && this.target) return;

    this.target = getTeleportTarget();
    this.scene.add(this.target);

    this.ray = getRay();
    this.scene.add(this.ray);
  };

  hideTeleportGeometry = () => {
    if (!this.ray || !this.target) return;

    this.scene.remove(this.ray);
    this.scene.remove(this.target);

    this.ray = null;
    this.target = null;
    this.curve = null;
    this.progress = 0;
  };

  updateGeometryVisibility() {
    if (!this.gamepadReady) return;

    const [, , , yAmplitide] = this.getGamepad().axes;
    const visible = yAmplitide < -0.5;

    if (visible) {
      this.showTeleportGeometry();
    } else {
      this.hideTeleportGeometry();
    }
  }

  update() {
    this.updateGeometryVisibility();
    this.updateObserverRotation();

    if (this.ray) {
      if (this.progress > 0) {
        this.updateObserverPosition();
      } else {
        // TODO: support selecting next target when flying
        this.updateTeleportGeometry();
      }
    }
  }
}
