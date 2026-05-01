import type { Integration } from '@sentry/core';
type SpotlightReactNativeIntegrationOptions = {
    /**
     * The URL of the Sidecar instance to connect and forward events to.
     * If not set, Spotlight will try to connect to the Sidecar running on localhost:8969.
     *
     * @default "http://localhost:8969/stream"
     */
    sidecarUrl?: string;
};
/**
 * Use this integration to send errors and transactions to Spotlight.
 *
 * Learn more about spotlight at https://spotlightjs.com
 */
export declare function spotlightIntegration({ sidecarUrl, }?: SpotlightReactNativeIntegrationOptions): Integration;
/**
 * Gets the default Spotlight sidecar URL.
 */
export declare function getDefaultSidecarUrl(): string;
export {};
//# sourceMappingURL=spotlight.d.ts.map
