import { dropUndefinedKeys } from '@sentry/core';
import { getBodySize, parseContentLengthHeader } from './networkUtils';
/**
 * Enrich an XHR breadcrumb with additional data for Mobile Replay network tab.
 */
export function enrichXhrBreadcrumbsForMobileReplay(breadcrumb, hint) {
    if (breadcrumb.category !== 'xhr' || !hint) {
        return;
    }
    const xhrHint = hint;
    if (!xhrHint.xhr) {
        return;
    }
    const now = Date.now();
    const { startTimestamp = now, endTimestamp = now, input, xhr } = xhrHint;
    const reqSize = getBodySize(input);
    const resSize = xhr.getResponseHeader('content-length')
        ? parseContentLengthHeader(xhr.getResponseHeader('content-length'))
        : _getBodySize(xhr.response, xhr.responseType);
    breadcrumb.data = dropUndefinedKeys(Object.assign({ start_timestamp: startTimestamp, end_timestamp: endTimestamp, request_body_size: reqSize, response_body_size: resSize }, breadcrumb.data));
}
function _getBodySize(body, responseType) {
    try {
        const bodyStr = responseType === 'json' && body && typeof body === 'object' ? JSON.stringify(body) : body;
        return getBodySize(bodyStr);
    }
    catch (_a) {
        return undefined;
    }
}
//# sourceMappingURL=xhrUtils.js.map