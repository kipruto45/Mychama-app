import type { Integration } from '@sentry/core';
import type { ReactNativeClientOptions } from '../options';
/**
 * Returns the default ReactNative integrations based on the current environment.
 *
 * Native integrations are only returned when native is enabled.
 *
 * Web integrations are only returned when running on web.
 */
export declare function getDefaultIntegrations(options: ReactNativeClientOptions): Integration[];
//# sourceMappingURL=default.d.ts.map