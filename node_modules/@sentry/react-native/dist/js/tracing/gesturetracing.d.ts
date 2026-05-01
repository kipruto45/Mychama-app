export declare const DEFAULT_BREADCRUMB_CATEGORY = "gesture";
export declare const DEFAULT_BREADCRUMB_TYPE = "user";
export declare const GESTURE_POSTFIX_LENGTH: number;
export declare const ACTION_GESTURE_FALLBACK = "gesture";
/**
 * Patches React Native Gesture Handler v2 Gesture to start a transaction on gesture begin with the appropriate label.
 * Example: ShoppingCartScreen.dismissGesture
 */
export declare function sentryTraceGesture<GestureT>(
/**
 * Label of the gesture to be used in transaction name.
 * Example: dismissGesture
 */
label: string, gesture: GestureT): GestureT;
//# sourceMappingURL=gesturetracing.d.ts.map