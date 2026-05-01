/// <reference types="react-native" />
/// <reference types="react" />
/** Convert a Content-Length header to number/undefined. */
export declare function parseContentLengthHeader(header: string | null | undefined): number | undefined;
export type RequestBody = null | Blob | FormData | URLSearchParams | string | ArrayBuffer | undefined;
/** Get the size of a body. */
export declare function getBodySize(body: RequestBody): number | undefined;
//# sourceMappingURL=networkUtils.d.ts.map