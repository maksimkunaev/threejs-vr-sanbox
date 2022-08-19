import * as THREE from 'three';
import helpers from './helpers.js';

const {
  getCubicCurve3,
  getIntersections,
} = helpers;

const getTeleportTarget = () => {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.2, 18),
    new THREE.MeshPhongMaterial({ color: '#185ADB' })
  );
  mesh.rotation.x = -Math.PI / 2;

  return mesh;
}

const getTeleportRay = () => {
  const bezierCurve = getCubicCurve3(0, 0, 0, -5, -5, -5);

  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(bezierCurve.getPoints(50)),
    new THREE.LineBasicMaterial({ color: 0xff0000 })
  );
}

export default class Teleportation {
  constructor({
    scene,
    targets,
    observer,
    controller,
  }) {
    this.scene = scene;
    this.targets = targets;
    this.observer = observer;
    this.controller = controller;
    this.teleportRay = null;
    this.teleportTarget = null;
    this.flyingInProgress = false;
    this.teleportProgress = 0;
    this.bezierCurve = null;

    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();
  }

  toggleTeleportGeometry = (button, axes = []) => {
    const [,,,yAmplitide] = axes;
    const visible = yAmplitide < -0.5;

    if (visible) {
     this.showTeleportGeometry();
    } else {
      this.hideTeleportGeometry();
    }
  }

  showTeleportGeometry = () => {
    if (this.teleportRay && this.teleportTarget) {
      return;
    }

    this.teleportTarget = getTeleportTarget();
    this.scene.add(this.teleportTarget);

    this.teleportRay = getTeleportRay();
    this.scene.add(this.teleportRay);
  }

  hideTeleportGeometry = () => {
    this.scene.remove(this.teleportTarget);
    this.scene.remove(this.teleportRay);

    this.teleportProgress = 0;
    this.flyingInProgress = false;
    this.teleportRay = null;
    this.teleportTarget = null;
    this.bezierCurve = null;
  }

  startTeleportation = () => {
    if (this.teleportRay && this.teleportTarget) {
      this.flyingInProgress = true; 
    }
  }

  updateTeleportGeometry = () => {
    const { teleportTarget, observer } = this;

    const intersects = getIntersections(
      this.controller,
      this.targets,
      this.raycaster,
      this.tempMatrix
    );
    const intersected = intersects[0];

    if (!intersected) return;

    const newCubicBezierCurve = getCubicCurve3(
      observer.position.x,
      observer.position.y,
      observer.position.z,
      teleportTarget.position.x,
      teleportTarget.position.y,
      teleportTarget.position.z
    );

    this.updateRayGeometry(newCubicBezierCurve);
    this.updateTargetGeometry(intersected);
  }

  updateRayGeometry(newCubicBezierCurve) {
    this.teleportRay.geometry = new THREE.BufferGeometry().setFromPoints(
      newCubicBezierCurve.getPoints(50)
    );
    this.teleportRay.geometry.buffersNeedUpdate = true;

    this.bezierCurve = newCubicBezierCurve;
  }

  updateTargetGeometry({ point }) {
    this.teleportTarget.position.set(point.x, point.y + 0.02, point.z);
  }

  updateObserverPosition = () => {
    if (this.teleportProgress < 1) {
      this.observer.position.copy(this.bezierCurve.getPointAt(this.teleportProgress));
      this.teleportProgress += 0.1;   
    } else {
      // TODO stop teleportation but keep geometry
      // TODO teleportation should be triggered on select event (not selectstart)
      // this.hideTeleportGeometry()
      this.flyingInProgress = false;
      this.teleportProgress = 0;
    }
  };

  // this is called in the main update loop
  update = () => {
    if (this.flyingInProgress && this.teleportRay) {
      this.updateObserverPosition();
    }

    if (!this.flyingInProgress && this.teleportRay) {
      this.updateTeleportGeometry();
    }
  }
}