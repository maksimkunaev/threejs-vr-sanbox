export default class Teleportation {
    constructor({ scene, observer, controllers, params }: {
        scene: any;
        observer: any;
        controllers: any;
        params: any;
    });
    ray: any;
    target: any;
    curve: any;
    gamepadReady: boolean;
    step: number;
    rotationStep: number;
    rotationThreshold: number;
    progress: number;
    controllerIndex: number;
    scene: any;
    params: any;
    observer: any;
    controllers: any;
    raycaster: any;
    tempMatrix: any;
    fly: () => void;
    getGamepad(): any;
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
