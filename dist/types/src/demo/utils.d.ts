export declare function getFloor(color: any, x: any, y: any, z: any): any;
export declare enum LIGHT_TYPES {
    PHONG = 0,
    HEMI = 1,
    DIRECTIONAL = 2,
    SPOT = 3,
    AMBIENT = 4
}
export declare const MENU_CONFIG: {
    image: string;
    position: number[];
    size: number[];
    name: LIGHT_TYPES;
    background: number;
}[];
export declare function getLightByType(type: LIGHT_TYPES): any;
export declare function getLight(type: any, position: any): any;
export declare function createMenu(): any;
export declare function setGUI({ model, renderer, camera, observer }: {
    model: any;
    renderer: any;
    camera: any;
    observer: any;
}): void;
