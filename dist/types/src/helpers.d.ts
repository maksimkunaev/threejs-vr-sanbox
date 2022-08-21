export declare const isVR: boolean;
export declare const pointer: {
    x: number;
    y: number;
};
export declare const getDefaultSize: () => {
    width: number;
    height: number;
};
export declare function createObserver(): any;
export declare function getCubicCurve3(x0: any, y0: any, z0: any, x2: any, y2: any, z2: any): any[];
export declare function needUpdateRenderSize(renderer: any): boolean;
export declare function loadModel({ url, onProgress, onError, position, castShadow, scale, }: {
    url: string;
    onProgress?: (arg: unknown) => void;
    onError?: (arg: unknown) => void;
    position: number[];
    castShadow?: boolean;
    scale?: number[];
}): Promise<unknown>;
