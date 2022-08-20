import * as THREE from 'three';
import Controllers from './controllers.js';
export default class Teleportation {
    params: any;
    targets: THREE.Object3D[];
    scene: THREE.Scene;
    observer: THREE.Object3D;
    controllers: Controllers;
    raycaster: any;
    tempMatrix: any;
    ray: any;
    curve: any;
    target: any;
    gamepadReady: boolean;
    step: number;
    rotationStep: number;
    rotationThreshold: number;
    progress: number;
    controllerIndex: number;
    constructor({ scene, observer, controllers, params }: {
        scene: any;
        observer: any;
        controllers: any;
        params: any;
    });
    fly: () => void;
    getGamepad(): any;
    updateTargets(targets: THREE.Object3D[]): void;
    addTargets(targets: THREE.Object3D[]): void;
    subscribeToTargets(): void;
    updateTeleportGeometry: () => void;
    updateRayGeometry(): void;
    updateTargetGeometry({ point }: {
        point: any;
    }): void;
    updateObserverPosition: () => void;
    updateObserverRotation(): void;
    showTeleportGeometry: () => void;
    hideTeleportGeometry: () => void;
    updateGeometryVisibility(): void;
    update(): void;
}
