import { normalize } from '@sentry/core';
const KEY = 'value';
/**
 * Converts any input into a valid record with string keys.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertToNormalizedObject(data) {
    const normalized = normalize(data);
    if (normalized !== null &&
        typeof normalized === 'object' &&
        !Array.isArray(normalized) &&
        normalized.constructor === Object) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return normalized;
    }
    else {
        return {
            [KEY]: normalized,
        };
    }
}
//# sourceMappingURL=normalize.js.map