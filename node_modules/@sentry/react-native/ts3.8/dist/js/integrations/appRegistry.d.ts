import type { Client, Integration } from '@sentry/core';
export declare const INTEGRATION_NAME = "AppRegistry";
export declare const appRegistryIntegration: () => Integration & {
    onRunApplication: (callback: () => void) => void;
};
export declare const patchAppRegistryRunApplication: (callbacks: (() => void)[]) => void;
export declare const getAppRegistryIntegration: (client?: Client | undefined) => ReturnType<typeof appRegistryIntegration> | undefined;
//# sourceMappingURL=appRegistry.d.ts.map
