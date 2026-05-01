import type { Integration } from '@sentry/core';
export declare const INTEGRATION_NAME = "PrimitiveTagIntegration";
/**
 * Format tags set with Primitive values with a standard string format.
 *
 * When this Integration is enable, the following types will have the following behaviour:
 *
 * Unaltered: string, null, number, and undefined values remain unchanged.
 *
 * Altered:
 *  Boolean values are now capitalized: true -> True, false -> False.
 *  Symbols are stringified.
 *
 */
export declare const primitiveTagIntegration: () => Integration;
//# sourceMappingURL=primitiveTagIntegration.d.ts.map