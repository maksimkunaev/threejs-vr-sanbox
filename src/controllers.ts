import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

import { isVR } from './helpers';
import DefaultScene from './';

const pointer = new THREE.Vector2();
const controllerModelFactory = new XRControllerModelFactory();

const KEY_CODES_MAP = {
  87: 'w',
  65: 'a',
  83: 's',
  68: 'd',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
};

type Keys = typeof KEY_CODES_MAP[keyof typeof KEY_CODES_MAP];

export default class Controllers {
  private _: DefaultScene;
  private params;

  private line: THREE.Line;
  raycaster = new THREE.Raycaster();
  tempMatrix = new THREE.Matrix4();

  controllers: any[] = [];
  gamepads: any[] = [];
  pressedKeys: Record<Keys, boolean> = {};

  private gamepadConnectedListeners = [[], []];
  private lastIntersected: THREE.Object3D | null = null;
  private intersectionsObjectCallbacks = []; // by controller index
  private pointerUnsubscribers = [{}, {}];

  constructor(root, params) {
    this._ = root;
    this.params = params;

    if (isVR) {
      this.initLine();
      this.createController(0);
      this.createController(1);
    } else {
      this._.renderer.domElement.addEventListener('pointermove', e => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      });

      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
    }
  }

  private onKeyDown = e => {
    this.pressedKeys[KEY_CODES_MAP[e.keyCode]] = true;
  };

  private onKeyUp = e => {
    delete this.pressedKeys[KEY_CODES_MAP[e.keyCode]];
  };

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
    const controller = this._.renderer.xr.getController(index);
    const grip = this._.renderer.xr.getControllerGrip(index);

    if (this.showRay) controller.add(this.line.clone());

    this.controllers[index] = controller;

    grip.add(controllerModelFactory.createControllerModel(grip));
    grip.addEventListener('connected', e => {
      const { gamepad } = e.data;
      this.gamepads[index] = gamepad;
      this.gamepadConnectedListeners[index].forEach(l => l(gamepad));
      this.gamepadConnectedListeners[index] = [];
    });

    this._.observer.add(controller);
    this._.observer.add(grip);
  }

  onGamepadConnected(index, callback) {
    if (!isVR) return;
    this.gamepadConnectedListeners[index].push(callback);
  }

  getIntersections(controllerIndex: number, objects: THREE.Object3D[]) {
    if (!objects.length) return [];

    if (isVR) {
      const controller = this.controllers[controllerIndex];
      this.tempMatrix.identity().extractRotation(controller.matrixWorld);
      this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);
    } else {
      this.raycaster.setFromCamera(pointer, this._.camera);
    }

    return this.raycaster.intersectObjects(objects, true); // TODO: optimize recursive search
  }

  private createListener = (cb, controllerIndex: number, objects?) => {
    if (!objects) return cb;

    const index = this.getIndex(controllerIndex);

    return () => {
      const intersections = this.getIntersections(index, objects);

      if (intersections[0]) cb(intersections[0]);
    };
  };

  isHoverEvent = event => /pointerenter|pointerleave/.test(event);

  getIndex = index => (isVR ? index : 0);

  on(controllerIndex: number, event, callback, objects?) {
    const index = this.getIndex(controllerIndex);

    if (this.isHoverEvent(event)) {
      objects.forEach(obj => {
        let map = this.intersectionsObjectCallbacks[index];

        if (!map) map = this.intersectionsObjectCallbacks[index] = new Map();

        if (!map.has(obj)) {
          map.set(obj, {
            pointerenter: [],
            pointerleave: [],
          });
        }

        const items = map.get(obj);

        items[event].push(callback);

        const controllerMap = this.pointerUnsubscribers[index];

        if (!controllerMap[event]) controllerMap[event] = {};

        const eventCallbacks = controllerMap[event];

        if (!eventCallbacks[callback]) eventCallbacks[callback] = [];

        eventCallbacks[callback].push(obj);
      });

      return;
    }

    const cb = this.createListener(callback, index, objects);

    if (isVR) {
      this.controllers[index].addEventListener(event, cb);
    } else {
      switch (event) {
        case 'selectstart':
          this._.renderer.domElement.addEventListener('pointerdown', cb);
        case 'selectend':
          this._.renderer.domElement.addEventListener('pointerup', cb);
      }
    }
  }

  off(controllerIndex, event, callback) {
    const index = this.getIndex(controllerIndex);

    if (this.isHoverEvent(event)) {
      this.pointerUnsubscribers[index][event][callback].forEach(obj => {
        const map = this.intersectionsObjectCallbacks[index];
        const callbacks = map.get(obj)[event];
        callbacks.splice(callbacks.indexOf(callback), 1);
      });

      return;
    }

    if (isVR) {
      this.controllers.forEach(c => c.removeEventListener(event, callback));
    } else {
      switch (event) {
        case 'selectstart':
          this._.renderer.domElement.removeEventListener(
            'pointerdown',
            callback
          );
        case 'selectend':
          this._.renderer.domElement.removeEventListener('pointerup', callback);
      }
    }
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
