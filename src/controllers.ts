import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

import { getIntersections } from './helpers';
import Teleportation from './teleport';

const controllerModelFactory = new XRControllerModelFactory();

type EventSubscribeParams = {
  objects?: THREE.Object3D[];
  index?: number;
};

export default class Controllers {
  params;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  observer: THREE.Object3D;
  line: THREE.Line;
  raycaster = new THREE.Raycaster();
  tempMatrix = new THREE.Matrix4();

  controllers: any[] = [];
  gamepads: any[] = [];

  gmapadConnectedListeners = [[], []];
  lastIntersected: THREE.Object3D | null = null;
  intersectionsObjectCallbacks = []; // by controller index
  pointerUnsubscribers = [{}, {}];

  constructor(renderer, observer, params) {
    this.renderer = renderer;
    this.observer = observer;
    this.params = params;

    this.initLine();

    this.createController(0);
    this.createController(1);
  }

  private initLine() {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);

    this.line = new THREE.Line(geometry);
    this.line.name = 'line'; // TODO: remove
    this.line.scale.z = 50;
  }

  get showRay() {
    return this.params?.showRay !== false;
  }

  private createController(index) {
    const controller = this.renderer.xr.getController(index);
    const grip = this.renderer.xr.getControllerGrip(index);

    if (this.showRay) controller.add(this.line.clone());

    this.controllers[index] = controller;

    grip.add(controllerModelFactory.createControllerModel(grip));
    grip.addEventListener('connected', e => {
      const { gamepad } = e.data;
      this.gamepads[index] = gamepad;
      this.gmapadConnectedListeners[index].forEach(l => l(gamepad));
      this.gmapadConnectedListeners[index] = [];
    });

    this.observer.add(controller);
    this.observer.add(grip);
  }

  onGamepadConnected(index, callback) {
    this.gmapadConnectedListeners[index].push(callback);
  }

  getIntersections(controllerIndex: number, objects: THREE.Object3D[]) {
    if (!objects.length) return [];

    return getIntersections(
      this.controllers[controllerIndex],
      objects,
      this.raycaster,
      this.tempMatrix
    );
  }

  private createListener = (cb, controllerIndex: number, objects?) => {
    if (!objects) return cb;

    return () => {
      const intersections = this.getIntersections(controllerIndex, objects);

      if (intersections[0]) cb(intersections[0]);
    };
  };

  isPointerEvent = event => /pointerenter|pointerleave/.test(event);

  on(controllerIndex: number, event, callback, objects?) {
    if (this.isPointerEvent(event)) {
      objects.forEach(obj => {
        let map = this.intersectionsObjectCallbacks[controllerIndex];
        if (!map)
          map = this.intersectionsObjectCallbacks[controllerIndex] = new Map();

        if (!map.has(obj)) {
          map.set(obj, {
            pointerenter: [],
            pointerleave: [],
          });
        }

        const items = map.get(obj);

        items[event].push(callback);

        const controllerMap = this.pointerUnsubscribers[controllerIndex];

        if (!controllerMap[event]) controllerMap[event] = {};

        const eventCallbacks = controllerMap[event];

        if (!eventCallbacks[callback]) eventCallbacks[callback] = [];

        eventCallbacks[callback].push(obj);
      });

      return;
    }

    const cb = this.createListener(callback, controllerIndex, objects);
    this.controllers[controllerIndex].addEventListener(event, cb);
  }

  off(controllerIndex, event, callback) {
    if (this.isPointerEvent(event)) {
      this.pointerUnsubscribers[controllerIndex][event][callback].forEach(
        obj => {
          const map = this.intersectionsObjectCallbacks[controllerIndex];
          const callbacks = map.get(obj)[event];
          callbacks.splice(callbacks.indexOf(callback), 1);
        }
      );

      return;
    }

    this.controllers.forEach(c => c.removeEventListener(event, callback));
  }

  private updateIntersections() {
    this.intersectionsObjectCallbacks.forEach((map, i) => {
      const objects = [...map.keys()];
      const obj = this.getIntersections(i, objects)[0]?.object;

      if (obj) {
        if (obj !== this.lastIntersected) {
          this.lastIntersected = obj;
          map.get(obj)?.pointerenter.forEach(l => l(obj));
        }
      } else {
        map
          .get(this.lastIntersected)
          ?.pointerleave.forEach(l => l(this.lastIntersected));
        this.lastIntersected = null;
      }
    });
  }

  update() {
    this.updateIntersections();
  }
}
