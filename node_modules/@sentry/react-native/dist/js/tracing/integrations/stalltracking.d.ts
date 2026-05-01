import type { Integration, Measurements, MeasurementUnit } from '@sentry/core';
import { STALL_COUNT, STALL_LONGEST_TIME, STALL_TOTAL_TIME } from '../../measurements';
export interface StallMeasurements extends Measurements {
    [STALL_COUNT]: {
        value: number;
        unit: MeasurementUnit;
    };
    [STALL_TOTAL_TIME]: {
        value: number;
        unit: MeasurementUnit;
    };
    [STALL_LONGEST_TIME]: {
        value: number;
        unit: MeasurementUnit;
    };
}
/**
 * Stall measurement tracker inspired by the `JSEventLoopWatchdog` used internally in React Native:
 * https://github.com/facebook/react-native/blob/006f5afe120c290a37cf6ff896748fbc062bf7ed/Libraries/Interaction/JSEventLoopWatchdog.js
 *
 * However, we modified the interval implementation to instead have a fixed loop timeout interval of `LOOP_TIMEOUT_INTERVAL_MS`.
 * We then would consider that iteration a stall when the total time for that interval to run is greater than `LOOP_TIMEOUT_INTERVAL_MS + minimumStallThreshold`
 */
export declare const stallTrackingIntegration: ({ minimumStallThresholdMs, }?: {
    /**
     * How long in milliseconds an event loop iteration can be delayed for before being considered a "stall."
     * @default 50
     */
    minimumStallThresholdMs?: number | undefined;
}) => Integration;
//# sourceMappingURL=stalltracking.d.ts.map