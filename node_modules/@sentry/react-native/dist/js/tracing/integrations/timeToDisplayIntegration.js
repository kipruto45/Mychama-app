var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { debug } from '@sentry/core';
import { NATIVE } from '../../wrapper';
import { UI_LOAD_FULL_DISPLAY, UI_LOAD_INITIAL_DISPLAY } from '../ops';
import { SPAN_ORIGIN_AUTO_UI_TIME_TO_DISPLAY, SPAN_ORIGIN_MANUAL_UI_TIME_TO_DISPLAY } from '../origin';
import { getReactNavigationIntegration } from '../reactnavigation';
import { SEMANTIC_ATTRIBUTE_ROUTE_HAS_BEEN_SEEN } from '../semanticAttributes';
import { SPAN_THREAD_NAME, SPAN_THREAD_NAME_JAVASCRIPT } from '../span';
import { getTimeToInitialDisplayFallback } from '../timeToDisplayFallback';
import { createSpanJSON } from '../utils';
export const INTEGRATION_NAME = 'TimeToDisplay';
const TIME_TO_DISPLAY_TIMEOUT_MS = 30000;
const isDeadlineExceeded = (durationMs) => durationMs > TIME_TO_DISPLAY_TIMEOUT_MS;
export const timeToDisplayIntegration = () => {
    let enableTimeToInitialDisplayForPreloadedRoutes = false;
    return {
        name: INTEGRATION_NAME,
        afterAllSetup(client) {
            var _a, _b;
            enableTimeToInitialDisplayForPreloadedRoutes =
                (_b = (_a = getReactNavigationIntegration(client)) === null || _a === void 0 ? void 0 : _a.options.enableTimeToInitialDisplayForPreloadedRoutes) !== null && _b !== void 0 ? _b : false;
        },
        processEvent: (event) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (event.type !== 'transaction') {
                // TimeToDisplay data is only relevant for transactions
                return event;
            }
            const rootSpanId = (_b = (_a = event.contexts) === null || _a === void 0 ? void 0 : _a.trace) === null || _b === void 0 ? void 0 : _b.span_id;
            if (!rootSpanId) {
                debug.warn(`[${INTEGRATION_NAME}] No root span id found in transaction.`);
                return event;
            }
            const transactionStartTimestampSeconds = event.start_timestamp;
            if (!transactionStartTimestampSeconds) {
                // This should never happen
                debug.warn(`[${INTEGRATION_NAME}] No transaction start timestamp found in transaction.`);
                return event;
            }
            event.spans = event.spans || [];
            event.measurements = event.measurements || {};
            const ttidSpan = yield addTimeToInitialDisplay({
                event,
                rootSpanId,
                transactionStartTimestampSeconds,
                enableTimeToInitialDisplayForPreloadedRoutes,
            });
            const ttfdSpan = yield addTimeToFullDisplay({ event, rootSpanId, transactionStartTimestampSeconds, ttidSpan });
            if ((ttidSpan === null || ttidSpan === void 0 ? void 0 : ttidSpan.start_timestamp) && (ttidSpan === null || ttidSpan === void 0 ? void 0 : ttidSpan.timestamp)) {
                event.measurements['time_to_initial_display'] = {
                    value: (ttidSpan.timestamp - ttidSpan.start_timestamp) * 1000,
                    unit: 'millisecond',
                };
            }
            if ((ttfdSpan === null || ttfdSpan === void 0 ? void 0 : ttfdSpan.start_timestamp) && (ttfdSpan === null || ttfdSpan === void 0 ? void 0 : ttfdSpan.timestamp)) {
                const durationMs = (ttfdSpan.timestamp - ttfdSpan.start_timestamp) * 1000;
                if (isDeadlineExceeded(durationMs)) {
                    if (event.measurements['time_to_initial_display']) {
                        event.measurements['time_to_full_display'] = event.measurements['time_to_initial_display'];
                    }
                }
                else {
                    event.measurements['time_to_full_display'] = {
                        value: durationMs,
                        unit: 'millisecond',
                    };
                }
            }
            const newTransactionEndTimestampSeconds = Math.max((_c = ttidSpan === null || ttidSpan === void 0 ? void 0 : ttidSpan.timestamp) !== null && _c !== void 0 ? _c : -1, (_d = ttfdSpan === null || ttfdSpan === void 0 ? void 0 : ttfdSpan.timestamp) !== null && _d !== void 0 ? _d : -1, (_e = event.timestamp) !== null && _e !== void 0 ? _e : -1);
            if (newTransactionEndTimestampSeconds !== -1) {
                event.timestamp = newTransactionEndTimestampSeconds;
            }
            return event;
        }),
    };
};
function addTimeToInitialDisplay({ event, rootSpanId, transactionStartTimestampSeconds, enableTimeToInitialDisplayForPreloadedRoutes, }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const ttidEndTimestampSeconds = yield NATIVE.popTimeToDisplayFor(`ttid-${rootSpanId}`);
        event.spans = event.spans || [];
        let ttidSpan = (_a = event.spans) === null || _a === void 0 ? void 0 : _a.find(span => span.op === UI_LOAD_INITIAL_DISPLAY);
        if (ttidSpan && (ttidSpan.status === undefined || ttidSpan.status === 'ok') && !ttidEndTimestampSeconds) {
            debug.log(`[${INTEGRATION_NAME}] Ttid span already exists and is ok.`, ttidSpan);
            return ttidSpan;
        }
        if (!ttidEndTimestampSeconds) {
            debug.log(`[${INTEGRATION_NAME}] No manual ttid end timestamp found for span ${rootSpanId}.`);
            return addAutomaticTimeToInitialDisplay({
                event,
                rootSpanId,
                transactionStartTimestampSeconds,
                enableTimeToInitialDisplayForPreloadedRoutes,
            });
        }
        if ((ttidSpan === null || ttidSpan === void 0 ? void 0 : ttidSpan.status) && ttidSpan.status !== 'ok') {
            ttidSpan.status = 'ok';
            ttidSpan.timestamp = ttidEndTimestampSeconds;
            debug.log(`[${INTEGRATION_NAME}] Updated existing ttid span.`, ttidSpan);
            return ttidSpan;
        }
        ttidSpan = createSpanJSON({
            op: UI_LOAD_INITIAL_DISPLAY,
            description: 'Time To Initial Display',
            start_timestamp: transactionStartTimestampSeconds,
            timestamp: ttidEndTimestampSeconds,
            origin: SPAN_ORIGIN_MANUAL_UI_TIME_TO_DISPLAY,
            parent_span_id: rootSpanId,
            data: {
                [SPAN_THREAD_NAME]: SPAN_THREAD_NAME_JAVASCRIPT,
            },
        });
        debug.log(`[${INTEGRATION_NAME}] Added ttid span to transaction.`, ttidSpan);
        event.spans.push(ttidSpan);
        return ttidSpan;
    });
}
function addAutomaticTimeToInitialDisplay({ event, rootSpanId, transactionStartTimestampSeconds, enableTimeToInitialDisplayForPreloadedRoutes, }) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        const ttidNativeTimestampSeconds = yield NATIVE.popTimeToDisplayFor(`ttid-navigation-${rootSpanId}`);
        const ttidFallbackTimestampSeconds = yield getTimeToInitialDisplayFallback(rootSpanId);
        const hasBeenSeen = (_c = (_b = (_a = event.contexts) === null || _a === void 0 ? void 0 : _a.trace) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[SEMANTIC_ATTRIBUTE_ROUTE_HAS_BEEN_SEEN];
        if (hasBeenSeen && !enableTimeToInitialDisplayForPreloadedRoutes) {
            debug.log(`[${INTEGRATION_NAME}] Route has been seen and time to initial display is disabled for preloaded routes.`);
            return undefined;
        }
        const ttidTimestampSeconds = ttidNativeTimestampSeconds !== null && ttidNativeTimestampSeconds !== void 0 ? ttidNativeTimestampSeconds : ttidFallbackTimestampSeconds;
        if (!ttidTimestampSeconds) {
            debug.log(`[${INTEGRATION_NAME}] No automatic ttid end timestamp found for span ${rootSpanId}.`);
            return undefined;
        }
        const viewNames = (_e = (_d = event.contexts) === null || _d === void 0 ? void 0 : _d.app) === null || _e === void 0 ? void 0 : _e.view_names;
        const screenName = Array.isArray(viewNames) ? viewNames[0] : viewNames;
        const ttidSpan = createSpanJSON({
            op: UI_LOAD_INITIAL_DISPLAY,
            description: screenName ? `${screenName} initial display` : 'Time To Initial Display',
            start_timestamp: transactionStartTimestampSeconds,
            timestamp: ttidTimestampSeconds,
            origin: SPAN_ORIGIN_AUTO_UI_TIME_TO_DISPLAY,
            parent_span_id: rootSpanId,
            data: {
                [SPAN_THREAD_NAME]: SPAN_THREAD_NAME_JAVASCRIPT,
            },
        });
        event.spans = (_f = event.spans) !== null && _f !== void 0 ? _f : [];
        event.spans.push(ttidSpan);
        return ttidSpan;
    });
}
function addTimeToFullDisplay({ event, rootSpanId, transactionStartTimestampSeconds, ttidSpan, }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const ttfdEndTimestampSeconds = yield NATIVE.popTimeToDisplayFor(`ttfd-${rootSpanId}`);
        if (!ttidSpan || !ttfdEndTimestampSeconds) {
            return undefined;
        }
        event.spans = event.spans || [];
        let ttfdSpan = (_a = event.spans) === null || _a === void 0 ? void 0 : _a.find(span => span.op === UI_LOAD_FULL_DISPLAY);
        let ttfdAdjustedEndTimestampSeconds = ttfdEndTimestampSeconds;
        const ttfdIsBeforeTtid = ttidSpan.timestamp && ttfdEndTimestampSeconds < ttidSpan.timestamp;
        if (ttfdIsBeforeTtid && ttidSpan.timestamp) {
            ttfdAdjustedEndTimestampSeconds = ttidSpan.timestamp;
        }
        const durationMs = (ttfdAdjustedEndTimestampSeconds - transactionStartTimestampSeconds) * 1000;
        if ((ttfdSpan === null || ttfdSpan === void 0 ? void 0 : ttfdSpan.status) && ttfdSpan.status !== 'ok') {
            ttfdSpan.status = 'ok';
            ttfdSpan.timestamp = ttfdAdjustedEndTimestampSeconds;
            debug.log(`[${INTEGRATION_NAME}] Updated existing ttfd span.`, ttfdSpan);
            return ttfdSpan;
        }
        ttfdSpan = createSpanJSON({
            status: isDeadlineExceeded(durationMs) ? 'deadline_exceeded' : 'ok',
            op: UI_LOAD_FULL_DISPLAY,
            description: 'Time To Full Display',
            start_timestamp: transactionStartTimestampSeconds,
            timestamp: ttfdAdjustedEndTimestampSeconds,
            origin: SPAN_ORIGIN_MANUAL_UI_TIME_TO_DISPLAY,
            parent_span_id: rootSpanId,
            data: {
                [SPAN_THREAD_NAME]: SPAN_THREAD_NAME_JAVASCRIPT,
            },
        });
        debug.log(`[${INTEGRATION_NAME}] Added ttfd span to transaction.`, ttfdSpan);
        event.spans.push(ttfdSpan);
        return ttfdSpan;
    });
}
//# sourceMappingURL=timeToDisplayIntegration.js.map