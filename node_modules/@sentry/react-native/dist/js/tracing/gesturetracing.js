import { addBreadcrumb, debug, SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN } from '@sentry/core';
import { startUserInteractionSpan } from './integrations/userInteraction';
import { UI_ACTION } from './ops';
import { SPAN_ORIGIN_AUTO_INTERACTION } from './origin';
export const DEFAULT_BREADCRUMB_CATEGORY = 'gesture';
export const DEFAULT_BREADCRUMB_TYPE = 'user';
export const GESTURE_POSTFIX_LENGTH = 'GestureHandler'.length;
export const ACTION_GESTURE_FALLBACK = 'gesture';
/**
 * Patches React Native Gesture Handler v2 Gesture to start a transaction on gesture begin with the appropriate label.
 * Example: ShoppingCartScreen.dismissGesture
 */
export function sentryTraceGesture(
/**
 * Label of the gesture to be used in transaction name.
 * Example: dismissGesture
 */
label, gesture) {
    const gestureCandidate = gesture;
    if (!gestureCandidate) {
        debug.warn('[GestureTracing] Gesture can not be undefined');
        return gesture;
    }
    if (!gestureCandidate.handlers) {
        debug.warn('[GestureTracing] Can not wrap gesture without handlers. If you want to wrap a gesture composition wrap individual gestures.');
        return gesture;
    }
    if (!label) {
        debug.warn('[GestureTracing] Can not wrap gesture without name.');
        return gesture;
    }
    const name = gestureCandidate.handlerName.length > GESTURE_POSTFIX_LENGTH
        ? gestureCandidate.handlerName
            .substring(0, gestureCandidate.handlerName.length - GESTURE_POSTFIX_LENGTH)
            .toLowerCase()
        : ACTION_GESTURE_FALLBACK;
    const originalOnBegin = gestureCandidate.handlers.onBegin;
    gesture.handlers.onBegin = (event) => {
        const span = startUserInteractionSpan({ elementId: label, op: `${UI_ACTION}.${name}` });
        if (span) {
            span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, SPAN_ORIGIN_AUTO_INTERACTION);
        }
        addGestureBreadcrumb(`Gesture ${label} begin.`, { event, name });
        if (originalOnBegin) {
            originalOnBegin(event);
        }
    };
    const originalOnEnd = gestureCandidate.handlers.onEnd;
    gesture.handlers.onEnd = (event) => {
        addGestureBreadcrumb(`Gesture ${label} end.`, { event, name });
        if (originalOnEnd) {
            originalOnEnd(event);
        }
    };
    return gesture;
}
function addGestureBreadcrumb(message, options) {
    const { event, name } = options;
    const crumb = {
        message,
        level: 'info',
        type: DEFAULT_BREADCRUMB_TYPE,
        category: DEFAULT_BREADCRUMB_CATEGORY,
    };
    if (event) {
        const data = {
            gesture: name,
        };
        for (const key of Object.keys(GestureEventKeys)) {
            const eventKey = GestureEventKeys[key];
            if (eventKey in event) {
                data[eventKey] = event[eventKey];
            }
        }
        crumb.data = data;
    }
    addBreadcrumb(crumb);
    debug.log(`[GestureTracing] ${crumb.message}`);
}
/**
 * Selected keys from RNGH 2 Gesture Event API.
 * We only want to send relevant data to save on payload size.
 * @hidden
 */
const GestureEventKeys = {
    NUMBER_OF_POINTERS: 'numberOfPointers',
    NUMBER_OF_TOUCHES: 'numberOfTouches',
    FORCE: 'force',
    FORCE_CHANGE: 'forceChange',
    ROTATION: 'rotation',
    ROTATION_CHANGE: 'rotationChange',
    SCALE: 'scale',
    SCALE_CHANGE: 'scaleChange',
    DURATION: 'duration',
    VELOCITY: 'velocity',
    VELOCITY_X: 'velocityX',
    VELOCITY_Y: 'velocityY',
};
//# sourceMappingURL=gesturetracing.js.map