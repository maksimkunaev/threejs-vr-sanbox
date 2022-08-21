import * as THREE from 'three';
import DefaultScene from './';
export default class Teleportation {
    _: DefaultScene;
    params: any;
    targets: THREE.Object3D[];
    target: any;
    curve: any;
    progressCurve: any;
    line: any;
    gamepadReady: boolean;
    isGeometryVisible: boolean;
    isThrottling: boolean;
    step: number;
    rotationStep: number;
    rotationThreshold: number;
    progress: number;
    controllerIndex: number;
    constructor(_: any, params: any);
    fly: () => void;
    getGamepad(): any;
    updateTargets(targets: THREE.Object3D[]): void;
    addTargets(targets: THREE.Object3D[]): void;
    subscribeToTargets(): void;
    getCurveVector(): any[];
    showTeleportGeometry: () => void;
    hideTeleportGeometry: () => void;
    updateTargetGeometry({ point }: {
        point: any;
    }): void;
    updateLineGeometry(): void;
    updateGeometry: () => void;
    updateObserverPosition: () => void;
    updateObserverRotation(): void;
    update(): void;
}
