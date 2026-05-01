import { PointerType } from '../PointerType';
import type { GestureHandlerRef, Point, StylusData, SVGRef } from './interfaces';
export declare function isPointerInBounds(view: HTMLElement, { x, y }: Point): boolean;
export declare const PointerTypeMapping: Map<string, PointerType>;
export declare const degToRad: (degrees: number) => number;
export declare const coneToDeviation: (degrees: number) => number;
export declare function calculateViewScale(view: HTMLElement): {
    scaleX: number;
    scaleY: number;
};
export declare function tryExtractStylusData(event: PointerEvent): StylusData | undefined;
export declare const RNSVGElements: Set<string>;
export declare function isRNSVGElement(viewRef: SVGRef | GestureHandlerRef): boolean;
export declare function isRNSVGNode(node: any): boolean;
//# sourceMappingURL=utils.d.ts.map