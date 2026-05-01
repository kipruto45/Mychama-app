import { type Integration } from '@sentry/core';
export declare const OTA_UPDATES_CONTEXT_KEY = "ota_updates";
/** Load device context from expo modules. */
export declare const expoContextIntegration: () => Integration;
/**
 * @internal Exposed for testing purposes
 */
export declare function getExpoUpdatesContext(): ExpoUpdatesContext;
type ExpoUpdatesContext = Partial<{
    is_enabled: boolean;
    is_embedded_launch: boolean;
    is_emergency_launch: boolean;
    is_using_embedded_assets: boolean;
    update_id: string;
    channel: string;
    runtime_version: string;
    check_automatically: string;
    emergency_launch_reason: string;
    launch_duration: number;
    created_at: string;
}>;
export {};
//# sourceMappingURL=expocontext.d.ts.map