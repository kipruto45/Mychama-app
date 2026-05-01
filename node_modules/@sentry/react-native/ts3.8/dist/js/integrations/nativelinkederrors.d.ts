import type { Integration } from '@sentry/core';
interface LinkedErrorsOptions {
    key: string;
    limit: number;
}
/**
 * Processes JS and RN native linked errors.
 */
export declare const nativeLinkedErrorsIntegration: (options?: Partial<LinkedErrorsOptions>) => Integration;
export {};
//# sourceMappingURL=nativelinkederrors.d.ts.map
