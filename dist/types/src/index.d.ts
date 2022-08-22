import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Controllers from './controllers.js';
import Teleportation from './teleport.js';
declare type Params = Record<string, any> & {};
export default class DefaultScene {
    params: Params;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
    controllers: Controllers;
    teleportation: Teleportation;
    observer: THREE.Mesh;
    orbitControls: OrbitControls;
    constructor(params?: Params);
    private initRenderer;
    private initScene;
    private initObserver;
    private initOrbitControls;
    private initCamera;
    private initControllers;
    private initAxesHelper;
    private initGridHelper;
    private initTeleportation;
    loadAudio({ url, targetMesh, listenerMeshes, onLoad }: {
        url: any;
        targetMesh: any;
        listenerMeshes: any;
        onLoad: any;
    }): void;
    setAspect(): void;
    update: (time: any) => void;
}
export {};
