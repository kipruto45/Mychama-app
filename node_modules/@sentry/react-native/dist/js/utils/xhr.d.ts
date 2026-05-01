/// <reference types="react-native" />
/**
 * The DONE ready state for XmlHttpRequest
 *
 * Defining it here as a constant b/c XMLHttpRequest.DONE is not always defined
 * (e.g. during testing, it is `undefined`)
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState}
 */
export declare const XHR_READYSTATE_DONE = 4;
/**
 * Creates a new XMLHttpRequest object which is not instrumented by the SDK.
 *
 * This request won't be captured by the HttpClient Errors integration
 * and won't be added to breadcrumbs and won't be traced.
 */
export declare function createStealthXhr(customGlobal?: {
    XMLHttpRequest?: typeof XMLHttpRequest;
}): XMLHttpRequest | null;
//# sourceMappingURL=xhr.d.ts.map