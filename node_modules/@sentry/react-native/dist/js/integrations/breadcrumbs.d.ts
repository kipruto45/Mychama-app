import type { Integration } from '@sentry/core';
interface BreadcrumbsOptions {
    /**
     * Log calls to console.log, console.debug, and so on.
     */
    console: boolean;
    /**
     * Log all click and keypress events.
     *
     * Only available on web. In React Native this is a no-op.
     */
    dom: boolean | {
        serializeAttribute?: string | string[];
        maxStringLength?: number;
    };
    /**
     * Log HTTP requests done with the global Fetch API.
     *
     * Disabled by default in React Native because fetch is built on XMLHttpRequest.
     * Enabled by default on web.
     *
     * Setting `fetch: true` and `xhr: true` will cause duplicates in React Native.
     */
    fetch: boolean;
    /**
     * Log calls to history.pushState and related APIs.
     *
     * Only available on web. In React Native this is a no-op.
     */
    history: boolean;
    /**
     * Log whenever we send an event to the server.
     */
    sentry: boolean;
    /**
     * Log HTTP requests done with the XHR API.
     *
     * Because React Native global fetch is built on XMLHttpRequest,
     * this will also log `fetch` network requests.
     *
     * Setting `fetch: true` and `xhr: true` will cause duplicates in React Native.
     */
    xhr: boolean;
}
export declare const breadcrumbsIntegration: (options?: Partial<BreadcrumbsOptions>) => Integration;
export {};
//# sourceMappingURL=breadcrumbs.d.ts.map