import { PinchGestureHandlerEventPayload } from './GestureHandlerEventPayload';
import { BaseGestureHandlerProps } from './gestureHandlerCommon';
/**
 * @deprecated PinchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Pinch()` instead.
 */
export interface PinchGestureHandlerProps extends BaseGestureHandlerProps<PinchGestureHandlerEventPayload> {
}
export declare const pinchHandlerName = "PinchGestureHandler";
/**
 * @deprecated PinchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Pinch()` instead.
 */
export type PinchGestureHandler = typeof PinchGestureHandler;
/**
 * @deprecated PinchGestureHandler will be removed in the future version of Gesture Handler. Use `Gesture.Pinch()` instead.
 */
export declare const PinchGestureHandler: import("react").ComponentType<PinchGestureHandlerProps & import("react").RefAttributes<any>>;
//# sourceMappingURL=PinchGestureHandler.d.ts.map