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
import { NATIVE } from '../wrapper';
const INTEGRATION_NAME = 'LogEnricher';
export const logEnricherIntegration = () => {
    return {
        name: INTEGRATION_NAME,
        setup(client) {
            client.on('afterInit', () => {
                cacheLogContext().then(() => {
                    client.on('beforeCaptureLog', (log) => {
                        processLog(log, client);
                    });
                }, reason => {
                    debug.log(reason);
                });
            });
        },
    };
};
let NativeCache = undefined;
/**
 * Sets a log attribute if the value exists and the attribute key is not already present.
 *
 * @param logAttributes - The log attributes object to modify.
 * @param key - The attribute key to set.
 * @param value - The value to set (only sets if truthy and key not present).
 * @param setEvenIfPresent - Whether to set the attribute if it is present. Defaults to true.
 */
function setLogAttribute(logAttributes, key, value, setEvenIfPresent = true) {
    if (value && (!logAttributes[key] || setEvenIfPresent)) {
        logAttributes[key] = value;
    }
}
function cacheLogContext() {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield NATIVE.fetchNativeLogAttributes();
            NativeCache = Object.assign(Object.assign(Object.assign({}, (((_a = response === null || response === void 0 ? void 0 : response.contexts) === null || _a === void 0 ? void 0 : _a.device) && {
                brand: (_b = response.contexts.device) === null || _b === void 0 ? void 0 : _b.brand,
                model: (_c = response.contexts.device) === null || _c === void 0 ? void 0 : _c.model,
                family: (_d = response.contexts.device) === null || _d === void 0 ? void 0 : _d.family,
            })), (((_e = response === null || response === void 0 ? void 0 : response.contexts) === null || _e === void 0 ? void 0 : _e.os) && {
                os: response.contexts.os.name,
                version: response.contexts.os.version,
            })), (((_f = response === null || response === void 0 ? void 0 : response.contexts) === null || _f === void 0 ? void 0 : _f.release) && {
                release: response.contexts.release,
            }));
        }
        catch (e) {
            return Promise.reject(`[LOGS]: Failed to prepare attributes from Native Layer: ${e}`);
        }
        return Promise.resolve();
    });
}
function processLog(log, client) {
    var _a;
    if (NativeCache === undefined) {
        return;
    }
    // Save log.attributes to a new variable
    const logAttributes = (_a = log.attributes) !== null && _a !== void 0 ? _a : {};
    // Use setLogAttribute with the variable instead of direct assignment
    setLogAttribute(logAttributes, 'device.brand', NativeCache.brand);
    setLogAttribute(logAttributes, 'device.model', NativeCache.model);
    setLogAttribute(logAttributes, 'device.family', NativeCache.family);
    setLogAttribute(logAttributes, 'os.name', NativeCache.os);
    setLogAttribute(logAttributes, 'os.version', NativeCache.version);
    setLogAttribute(logAttributes, 'sentry.release', NativeCache.release);
    const replay = client.getIntegrationByName('MobileReplay');
    setLogAttribute(logAttributes, 'sentry.replay_id', replay === null || replay === void 0 ? void 0 : replay.getReplayId());
    // Set log.attributes to the variable
    log.attributes = logAttributes;
}
//# sourceMappingURL=logEnricherIntegration.js.map