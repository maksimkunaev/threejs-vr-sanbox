import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';

import * as H from './helpers.js';
import Controllers from './controllers.js';
import Teleportation from './teleport.js';

type Params = Record<string, any> & {
  // onReady: (DS: DefaultScene) => void;
};

export default class DefaultScene {
  params: Params;
  isVRSupported = false;

  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  controllers: Controllers;
  teleportation: Teleportation;
  observer: THREE.Mesh;
  selected: THREE.Object3D | null = null;

  constructor(params: Params = {}) {
    this.params = params;
    this.init();
  }

  async init() {
    const p = this.params;

    this.initScene();
    this.initObserver();
    this.initCamera();
    this.initRenderer(p.renderer);

    // @ts-ignore
    this.isVRSupported = await navigator.xr?.isSessionSupported('immersive-vr');

    this.initControllers(p.controllers);
    this.initTeleportation(p.teleportation);

    p.onReady?.(this);

    if (this.isVRSupported) {
      this.renderer.xr.enabled = true;
      document.body.appendChild(VRButton.createButton(this.renderer));
    }

    this.renderer.setAnimationLoop(this.update);
  }

  private initRenderer(params: any = {}) {
    const {
      configure,
      pixelRatio = window.devicePixelRatio,
      size = H.getDefaultSize(),
      ...rest
    } = params;

    this.renderer = new THREE.WebGLRenderer(rest);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(size.width, size.height);
    // this.renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.resize);
    this.resize();

    configure?.(this.renderer);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.params.scene?.configure?.(this.scene);
  }

  private initObserver() {
    const { configure } = this.params.observer || {};

    this.observer = H.createObserver();
    this.observer.rotation.y = 1;

    configure?.(this.observer);

    this.scene.add(this.observer);
  }

  private initCamera(params = this.params.camera) {
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

    this.camera.position.y = 2;

    this.observer.add(this.camera);
  }

  private initControllers(params) {
    if (!params) return;

    this.controllers = new Controllers(this, params);

    this.controllers.on(1, 'select', this.onObjectSelect, this.scene.children);
  }

  private initTeleportation(params) {
    if (!params) return;

    this.teleportation = new Teleportation(this, params);
  }

  onObjectSelect = (obj: THREE.Object3D) => {
    console.log('onObjectSelect', obj);

    this.selected = obj;
  };

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

  resize = () => {
    const canvas = this.renderer.domElement;
    const { clientWidth, clientHeight } = canvas.parentElement;

    if (
      clientHeight === canvas.clientHeight &&
      clientWidth === canvas.clientWidth
    )
      return;

    this.renderer.setSize(clientWidth, clientHeight);
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
  };

  update = time => {
    time *= 0.0005;

    this.params.update(time);
    this.controllers.update();
    this.teleportation?.update();

    this.renderer.render(this.scene, this.camera);
  };
}
