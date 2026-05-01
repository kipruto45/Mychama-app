import type { EnvelopeItem } from '@sentry/core';
type EnvelopeItemPayload = EnvelopeItem[1];
/**
 * Extracts the hard crash information from the event exceptions.
 * No exceptions or undefined handled are not hard crashes.
 *
 * Hard crashes are only unhandled error, not user set unhandled mechanisms.
 */
export declare function isHardCrash(payload: EnvelopeItemPayload): boolean;
export {};
//# sourceMappingURL=misc.d.ts.map
