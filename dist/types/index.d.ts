import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Controllers from './controllers.js';
import Teleportation from './teleport.js';
declare type Params = Record<string, any> & {};
export default class DefaultScene {
    isXREnabled: boolean;
    params: Params;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
    controllers: Controllers;
    teleportation: Teleportation;
    observer: THREE.Mesh;
    orbitControls: OrbitControls;
    gltfLoader: GLTFLoader;
    updaters: any[];
    callbacks: {
        onSelectStart: any[];
        onSelectEnd: any[];
        onSticksEvents: any[];
    };
    constructor(params?: Params);
    initRenderer(): void;
    initScene(): void;
    initObserver(): void;
    initOrbitControls(params?: any): void;
    initCamera(params?: any): void;
    private initControllers;
    private initTeleportation;
    loadModel({ url, onProgress, onError, position, scale }: {
        url: any;
        onProgress: any;
        onError: any;
        position: any;
        scale: any;
    }): Promise<unknown>;
    loadAudio({ url, targetMesh, listenerMeshes, onLoad }: {
        url: any;
        targetMesh: any;
        listenerMeshes: any;
        onLoad: any;
    }): void;
    setAspect(): void;
    onSelectStart: (e: any) => void;
    onSelectEnd: (e: any) => void;
    update: (time: any) => void;
}
export {};
