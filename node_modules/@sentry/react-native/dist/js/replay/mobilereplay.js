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
import { isHardCrash } from '../misc';
import { hasHooks } from '../utils/clientutils';
import { isExpoGo, notMobileOs } from '../utils/environment';
import { NATIVE } from '../wrapper';
import { enrichXhrBreadcrumbsForMobileReplay } from './xhrUtils';
export const MOBILE_REPLAY_INTEGRATION_NAME = 'MobileReplay';
const defaultOptions = {
    maskAllText: true,
    maskAllImages: true,
    maskAllVectors: true,
    enableExperimentalViewRenderer: false,
    enableViewRendererV2: true,
    enableFastViewRendering: false,
};
function mergeOptions(initOptions) {
    const merged = Object.assign(Object.assign({}, defaultOptions), initOptions);
    if (initOptions.enableViewRendererV2 === undefined && initOptions.enableExperimentalViewRenderer !== undefined) {
        merged.enableViewRendererV2 = initOptions.enableExperimentalViewRenderer;
    }
    return merged;
}
/**
 * The Mobile Replay Integration, let's you adjust the default mobile replay options.
 * To be passed to `Sentry.init` with `replaysOnErrorSampleRate` or `replaysSessionSampleRate`.
 *
 * ```javascript
 * Sentry.init({
 *  replaysOnErrorSampleRate: 1.0,
 *  replaysSessionSampleRate: 1.0,
 *  integrations: [mobileReplayIntegration({
 *    // Adjust the default options
 *  })],
 * });
 * ```
 *
 * @experimental
 */
export const mobileReplayIntegration = (initOptions = defaultOptions) => {
    if (isExpoGo()) {
        debug.warn(`[Sentry] ${MOBILE_REPLAY_INTEGRATION_NAME} is not supported in Expo Go. Use EAS Build or \`expo prebuild\` to enable it.`);
    }
    if (notMobileOs()) {
        debug.warn(`[Sentry] ${MOBILE_REPLAY_INTEGRATION_NAME} is not supported on this platform.`);
    }
    if (isExpoGo() || notMobileOs()) {
        return mobileReplayIntegrationNoop();
    }
    const options = mergeOptions(initOptions);
    function processEvent(event) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const hasException = ((_a = event.exception) === null || _a === void 0 ? void 0 : _a.values) && event.exception.values.length > 0;
            if (!hasException) {
                // Event is not an error, will not capture replay
                return event;
            }
            const recordingReplayId = NATIVE.getCurrentReplayId();
            if (recordingReplayId) {
                debug.log(`[Sentry] ${MOBILE_REPLAY_INTEGRATION_NAME} assign already recording replay ${recordingReplayId} for event ${event.event_id}.`);
                return event;
            }
            const replayId = yield NATIVE.captureReplay(isHardCrash(event));
            if (!replayId) {
                debug.log(`[Sentry] ${MOBILE_REPLAY_INTEGRATION_NAME} not sampled for event ${event.event_id}.`);
                return event;
            }
            return event;
        });
    }
    function setup(client) {
        if (!hasHooks(client)) {
            return;
        }
        client.on('createDsc', (dsc) => {
            if (dsc.replay_id) {
                return;
            }
            // TODO: For better performance, we should emit replayId changes on native, and hold the replayId value in JS
            const currentReplayId = NATIVE.getCurrentReplayId();
            if (currentReplayId) {
                dsc.replay_id = currentReplayId;
            }
        });
        client.on('beforeAddBreadcrumb', enrichXhrBreadcrumbsForMobileReplay);
    }
    function getReplayId() {
        return NATIVE.getCurrentReplayId();
    }
    // TODO: When adding manual API, ensure overlap with the web replay so users can use the same API interchangeably
    // https://github.com/getsentry/sentry-javascript/blob/develop/packages/replay-internal/src/integration.ts#L45
    return {
        name: MOBILE_REPLAY_INTEGRATION_NAME,
        setup,
        processEvent,
        options: options,
        getReplayId: getReplayId,
    };
};
const mobileReplayIntegrationNoop = () => {
    return {
        name: MOBILE_REPLAY_INTEGRATION_NAME,
        options: defaultOptions,
        getReplayId: () => null, // Mock implementation for noop version
    };
};
//# sourceMappingURL=mobilereplay.js.map