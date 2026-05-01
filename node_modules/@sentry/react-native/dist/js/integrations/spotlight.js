import { debug, serializeEnvelope } from '@sentry/core';
import { ReactNativeLibraries } from '../utils/rnlibraries';
import { createStealthXhr, XHR_READYSTATE_DONE } from '../utils/xhr';
/**
 * Use this integration to send errors and transactions to Spotlight.
 *
 * Learn more about spotlight at https://spotlightjs.com
 */
export function spotlightIntegration({ sidecarUrl = getDefaultSidecarUrl(), } = {}) {
    debug.log('[Spotlight] Using Sidecar URL', sidecarUrl);
    return {
        name: 'Spotlight',
        setupOnce() {
            // nothing to do here
        },
        setup(client) {
            setup(client, sidecarUrl);
        },
    };
}
function setup(client, sidecarUrl) {
    sendEnvelopesToSidecar(client, sidecarUrl);
}
function sendEnvelopesToSidecar(client, sidecarUrl) {
    if (!client.on) {
        return;
    }
    client.on('beforeEnvelope', (originalEnvelope) => {
        // TODO: This is a workaround for spotlight/sidecar not supporting images
        const spotlightEnvelope = [...originalEnvelope];
        const envelopeItems = [...originalEnvelope[1]].filter(item => typeof item[0].content_type !== 'string' || !item[0].content_type.startsWith('image'));
        spotlightEnvelope[1] = envelopeItems;
        const xhr = createStealthXhr();
        if (!xhr) {
            debug.error('[Spotlight] Sentry SDK can not create XHR object');
            return;
        }
        xhr.open('POST', sidecarUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/x-sentry-envelope');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XHR_READYSTATE_DONE) {
                const status = xhr.status;
                if (status === 0 || (status >= 200 && status < 400)) {
                    // The request has been completed successfully
                }
                else {
                    // Handle the error
                    debug.error("[Spotlight] Sentry SDK can't connect to Spotlight is it running? See https://spotlightjs.com to download it.", new Error(xhr.statusText));
                }
            }
        };
        xhr.send(serializeEnvelope(spotlightEnvelope));
    });
}
const DEFAULT_SIDECAR_URL = 'http://localhost:8969/stream';
/**
 * Gets the default Spotlight sidecar URL.
 */
export function getDefaultSidecarUrl() {
    var _a, _b;
    try {
        const { url } = (_b = (_a = ReactNativeLibraries.Devtools) === null || _a === void 0 ? void 0 : _a.getDevServer()) !== null && _b !== void 0 ? _b : {};
        if (!url) {
            return DEFAULT_SIDECAR_URL;
        }
        return `http://${getHostnameFromString(url)}:8969/stream`;
    }
    catch (_oO) {
        // We can't load devserver URL
    }
    return DEFAULT_SIDECAR_URL;
}
/**
 * React Native implementation of the URL class is missing the `hostname` property.
 */
function getHostnameFromString(urlString) {
    const regex = /^(?:\w+:)?\/\/([^/:]+)(:\d+)?(.*)$/;
    const matches = urlString.match(regex);
    if (matches === null || matches === void 0 ? void 0 : matches[1]) {
        return matches[1];
    }
    else {
        // Invalid URL format
        return null;
    }
}
//# sourceMappingURL=spotlight.js.map