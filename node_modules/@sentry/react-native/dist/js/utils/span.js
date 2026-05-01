import { getRootSpan, SentrySpan } from '@sentry/core';
/**
 *
 */
export function isSentrySpan(span) {
    return span instanceof SentrySpan;
}
/**
 *
 */
export function isRootSpan(span) {
    return span === getRootSpan(span);
}
const END_TIME_SCOPE_FIELD = '_endTime';
const CONVERT_SPAN_TO_TRANSACTION_FIELD = '_convertSpanToTransaction';
/**
 *
 */
export function setEndTimeValue(span, endTimestamp) {
    span['_endTime'] = endTimestamp;
}
/**
 *
 */
export function convertSpanToTransaction(span) {
    var _a, _b;
    return (_b = (_a = span)['_convertSpanToTransaction']) === null || _b === void 0 ? void 0 : _b.call(_a);
}
//# sourceMappingURL=span.js.map