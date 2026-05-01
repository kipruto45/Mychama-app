var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { debug, timestampInSeconds } from '@sentry/core';
import { AsyncExpiringMap } from '../../utils/AsyncExpiringMap';
import { isRootSpan } from '../../utils/span';
import { NATIVE } from '../../wrapper';
/**
 * Timeout from the start of a span to fetching the associated native frames.
 */
const FETCH_FRAMES_TIMEOUT_MS = 2000;
/**
 * This is the time end frames data from the native layer will be
 * kept in memory and waiting for the event processing. This ensures that spans
 * which are never processed are not leaking memory.
 */
const END_FRAMES_TIMEOUT_MS = 2000;
/**
 * This is the time start frames data from the native layer will be
 * kept in memory and waiting for span end. This ensures that spans
 * which never end or are not processed are not leaking memory.
 */
const START_FRAMES_TIMEOUT_MS = 60000;
/**
 * A margin of error of 50ms is allowed for the async native bridge call.
 * Anything larger would reduce the accuracy of our frames measurements.
 */
const MARGIN_OF_ERROR_SECONDS = 0.05;
const INTEGRATION_NAME = 'NativeFrames';
export const createNativeFramesIntegrations = (enable) => {
    if (!enable && NATIVE.enableNative) {
        // On Android this will free up resource when JS reloaded (native modules stay) and thus JS side of the SDK reinitialized.
        NATIVE.disableNativeFramesTracking();
        return undefined;
    }
    return nativeFramesIntegration();
};
/**
 * Instrumentation to add native slow/frozen frames measurements onto transactions.
 */
export const nativeFramesIntegration = () => {
    /** The native frames at the finish time of the most recent span. */
    let _lastChildSpanEndFrames = null;
    const _spanToNativeFramesAtStartMap = new AsyncExpiringMap({
        ttl: START_FRAMES_TIMEOUT_MS,
    });
    const _spanToNativeFramesAtEndMap = new AsyncExpiringMap({ ttl: END_FRAMES_TIMEOUT_MS });
    /**
     * Hooks into the client start and end span events.
     */
    const setup = (client) => {
        if (!NATIVE.enableNative) {
            debug.warn(`[${INTEGRATION_NAME}] This is not available on the Web, Expo Go and other platforms without native modules.`);
            return undefined;
        }
        NATIVE.enableNativeFramesTracking();
        client.on('spanStart', fetchStartFramesForSpan);
        client.on('spanEnd', fetchEndFramesForSpan);
    };
    const fetchStartFramesForSpan = (rootSpan) => {
        if (!isRootSpan(rootSpan)) {
            return;
        }
        const spanId = rootSpan.spanContext().spanId;
        debug.log(`[${INTEGRATION_NAME}] Fetching frames for root span start (${spanId}).`);
        _spanToNativeFramesAtStartMap.set(spanId, new Promise(resolve => {
            fetchNativeFrames()
                .then(frames => resolve(frames))
                .then(undefined, error => {
                debug.log(`[${INTEGRATION_NAME}] Error while fetching native frames.`, error);
                resolve(null);
            });
        }));
    };
    const fetchEndFramesForSpan = (span) => {
        const timestamp = timestampInSeconds();
        const spanId = span.spanContext().spanId;
        if (isRootSpan(span)) {
            const hasStartFrames = _spanToNativeFramesAtStartMap.has(spanId);
            if (!hasStartFrames) {
                // We don't have start frames, won't be able to calculate the difference.
                return;
            }
            debug.log(`[${INTEGRATION_NAME}] Fetch frames for root span end (${spanId}).`);
            _spanToNativeFramesAtEndMap.set(spanId, new Promise(resolve => {
                fetchNativeFrames()
                    .then(frames => {
                    resolve({
                        timestamp,
                        nativeFrames: frames,
                    });
                })
                    .then(undefined, error => {
                    debug.log(`[${INTEGRATION_NAME}] Error while fetching native frames.`, error);
                    resolve(null);
                });
            }));
            return undefined;
        }
        else {
            debug.log(`[${INTEGRATION_NAME}] Fetch frames for child span end (${spanId}).`);
            fetchNativeFrames()
                .then(frames => {
                _lastChildSpanEndFrames = {
                    timestamp,
                    nativeFrames: frames,
                };
            })
                .catch(error => debug.log(`[${INTEGRATION_NAME}] Error while fetching native frames.`, error));
        }
    };
    const processEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (event.type !== 'transaction' ||
            !event.transaction ||
            !event.contexts ||
            !event.contexts.trace ||
            !event.timestamp ||
            !event.contexts.trace.span_id) {
            return event;
        }
        const traceOp = event.contexts.trace.op;
        const spanId = event.contexts.trace.span_id;
        const startFrames = yield _spanToNativeFramesAtStartMap.pop(spanId);
        if (!startFrames) {
            debug.warn(`[${INTEGRATION_NAME}] Start frames of transaction ${event.transaction} (eventId, ${event.event_id}) are missing, but the transaction already ended.`);
            return event;
        }
        const endFrames = yield _spanToNativeFramesAtEndMap.pop(spanId);
        let finalEndFrames;
        if (endFrames && isClose(endFrames.timestamp, event.timestamp)) {
            // Must be in the margin of error of the actual transaction finish time (finalEndTimestamp)
            debug.log(`[${INTEGRATION_NAME}] Using frames from root span end (spanId, ${spanId}).`);
            finalEndFrames = endFrames.nativeFrames;
        }
        else if (_lastChildSpanEndFrames && isClose(_lastChildSpanEndFrames.timestamp, event.timestamp)) {
            // Fallback to the last span finish if it is within the margin of error of the actual finish timestamp.
            // This should be the case for trimEnd.
            debug.log(`[${INTEGRATION_NAME}] Using native frames from last child span end (spanId, ${spanId}).`);
            finalEndFrames = _lastChildSpanEndFrames.nativeFrames;
        }
        else {
            debug.warn(`[${INTEGRATION_NAME}] Frames were collected within larger than margin of error delay for spanId (${spanId}). Dropping the inaccurate values.`);
            return event;
        }
        const measurements = {
            frames_total: {
                value: finalEndFrames.totalFrames - startFrames.totalFrames,
                unit: 'none',
            },
            frames_frozen: {
                value: finalEndFrames.frozenFrames - startFrames.frozenFrames,
                unit: 'none',
            },
            frames_slow: {
                value: finalEndFrames.slowFrames - startFrames.slowFrames,
                unit: 'none',
            },
        };
        if (measurements.frames_frozen.value <= 0 &&
            measurements.frames_slow.value <= 0 &&
            measurements.frames_total.value <= 0) {
            debug.warn(`[${INTEGRATION_NAME}] Detected zero slow or frozen frames. Not adding measurements to spanId (${spanId}).`);
            return event;
        }
        debug.log(`[${INTEGRATION_NAME}] Adding measurements to ${traceOp} transaction ${event.transaction}: ${JSON.stringify(measurements, undefined, 2)}`);
        event.measurements = Object.assign(Object.assign({}, ((_a = event.measurements) !== null && _a !== void 0 ? _a : {})), measurements);
        return event;
    });
    return {
        name: INTEGRATION_NAME,
        setup,
        processEvent,
    };
};
function fetchNativeFrames() {
    return new Promise((resolve, reject) => {
        NATIVE.fetchNativeFrames()
            .then(value => {
            if (!value) {
                reject('Native frames response is null.');
                return;
            }
            resolve(value);
        })
            .then(undefined, error => {
            reject(error);
        });
        setTimeout(() => {
            reject('Fetching native frames took too long. Dropping frames.');
        }, FETCH_FRAMES_TIMEOUT_MS);
    });
}
function isClose(t1, t2) {
    return Math.abs(t1 - t2) < MARGIN_OF_ERROR_SECONDS;
}
//# sourceMappingURL=nativeFrames.js.map