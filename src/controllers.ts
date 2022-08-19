import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

import { getIntersections } from './helpers';

export default class Controllers {
  scene;
  renderer;

  controllers = [];
  gamepads = [];

  intersectListeners = new Map();
  raycaster = new THREE.Raycaster();
  tempMatrix = new THREE.Matrix4();

  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.controllers = [
      renderer.xr.getController(0),
      renderer.xr.getController(1),
    ];

    scene.add(this.controllers[0]);
    scene.add(this.controllers[1]);

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

    grip1.addEventListener('connected', e => {
      this.gamepad1 = e.data.gamepad;
    });

    grip2.addEventListener('connected', e => {
      this.gamepad2 = e.data.gamepad;
    });

    this.observer.add(controller1);
    this.observer.add(controller2);

    this.controller1 = controller1;
    this.controller2 = controller2;
  }

  on(event, callback, data = {}) {
    const { objects, controlledIndex } = data;

    switch (event) {
      case 'squeeze':
        this.controller1.addEventListener('squeeze', callback);
    }
  }

  private onSqueeze = (cb, data) => {
    if (!data) return cb;

    return () => {};
  };

  subscribeIntersectObjects(event, objects, callback) {
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
}
