import type { ReactTestInstance } from 'react-test-renderer';
import type { Point } from './types';
/**
 * Simulated native state for unmanaged controls.
 *
 * Values from `value` props (managed controls) should take precedence over these values.
 */
export type NativeState = {
    valueForElement: WeakMap<ReactTestInstance, string>;
    contentOffsetForElement: WeakMap<ReactTestInstance, Point>;
};
export declare const nativeState: NativeState;
