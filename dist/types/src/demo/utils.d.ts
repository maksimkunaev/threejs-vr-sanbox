export declare enum LIGHT_TYPES {
    PHONG = 0,
    HEMI = 1,
    DIRECTIONAL = 2,
    SPOT = 3,
    AMBIENT = 4
}
export declare const Spinner: () => any;
export declare const MENU_CONFIG: ({
    position: number[];
    size: number[];
    name: LIGHT_TYPES;
    background: string;
    roomSettings: {
        backgroundColor: string;
        objects: ({
            name: string;
            mesh: any;
            teleportation?: undefined;
            async?: undefined;
            getMesh?: undefined;
        } | {
            name: string;
            teleportation: boolean;
            mesh: any;
            async?: undefined;
            getMesh?: undefined;
        } | {
            name: string;
            async: boolean;
            teleportation: boolean;
            getMesh: () => Promise<unknown>;
            mesh?: undefined;
        })[];
    };
} | {
    position: number[];
    size: number[];
    name: LIGHT_TYPES;
    background: number;
    roomSettings: {
        backgroundColor: string;
        objects: ({
            name: string;
            mesh: any;
            teleportation?: undefined;
            async?: undefined;
            isStats?: undefined;
            getMesh?: undefined;
        } | {
            name: string;
            teleportation: boolean;
            mesh: any;
            async?: undefined;
            isStats?: undefined;
            getMesh?: undefined;
        } | {
            name: string;
            async: boolean;
            isStats: boolean;
            teleportation: boolean;
            getMesh: () => Promise<unknown>;
            mesh?: undefined;
        })[];
    };
})[];
export declare function getFloor({ color, texture, repeat, }: {
    color: number | string;
    texture?: string;
    repeat?: boolean;
}): any;
export declare function getLightByType(type: LIGHT_TYPES, intensity: number): any;
export declare function getLight(type: any, position: any, intensity: any): any;
export declare const setSkyBox: (scene: THREE.Mesh, src: string) => void;
export declare function createMenu(): any;
export declare function setGUI({ globalState, model, renderer, camera, observer }: {
    globalState: any;
    model: any;
    renderer: any;
    camera: any;
    observer: any;
}): void;
