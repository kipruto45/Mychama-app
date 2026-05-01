import { breadcrumbsIntegration as browserBreadcrumbsIntegration } from '@sentry/browser';
import { isWeb } from '../utils/environment';
export const breadcrumbsIntegration = (options = {}) => {
    var _a, _b, _c;
    const _options = Object.assign(Object.assign({ 
        // FIXME: In mobile environment XHR is implemented by native APIs, which are instrumented by the Native SDK.
        // This will cause duplicates in React Native. On iOS `NSURLSession` is instrumented by default. On Android
        // `OkHttp` is only instrumented by SAGP.
        xhr: true, console: true, sentry: true }, options), { fetch: (_a = options.fetch) !== null && _a !== void 0 ? _a : (isWeb() ? true : false), dom: isWeb() ? (_b = options.dom) !== null && _b !== void 0 ? _b : true : false, history: isWeb() ? (_c = options.history) !== null && _c !== void 0 ? _c : true : false });
    // Historically we had very little issue using the browser breadcrumbs integration
    // and thus we don't cherry pick the implementation like for example the Sentry Deno SDK does.
    // https://github.com/getsentry/sentry-javascript/blob/d007407c2e51d93d6d3933f9dea1e03ff3f4a4ab/packages/deno/src/integrations/breadcrumbs.ts#L34
    return browserBreadcrumbsIntegration(_options);
};
//# sourceMappingURL=breadcrumbs.js.map