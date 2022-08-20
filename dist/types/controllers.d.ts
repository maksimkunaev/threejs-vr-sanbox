import * as THREE from 'three';
export default class Controllers {
    params: any;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    observer: THREE.Object3D;
    line: THREE.Line;
    raycaster: any;
    tempMatrix: any;
    controllers: any[];
    gamepads: any[];
    gmapadConnectedListeners: any[][];
    lastIntersected: THREE.Object3D | null;
    intersectionsObjectCallbacks: any[];
    listeners: {
        pointerenter: any[];
        pointerleave: any[];
    };
    constructor(renderer: any, observer: any, params: any);
    private initLine;
    get showRay(): boolean;
    private createController;
    onGamepadConnected(index: any, callback: any): void;
    getIntersections(controllerIndex: number, objects: THREE.Object3D[]): any;
    private createListener;
    on(controllerIndex: number, event: any, callback: any, objects?: any): void;
    off(event: any, callback: any): void;
    private updateIntersections;
    update(): void;
}
