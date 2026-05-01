import { getMainCarrier } from '@sentry/core';
export declare const getSentryCarrier: () => SentryCarrier;
type SentryCarrier = Required<ReturnType<typeof getMainCarrier>>['__SENTRY__'][string];
export {};
//# sourceMappingURL=carrier.d.ts.map