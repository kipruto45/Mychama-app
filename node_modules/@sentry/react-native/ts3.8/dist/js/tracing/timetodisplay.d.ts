import type { Span, StartSpanOptions } from '@sentry/core';
import * as React from 'react';
/**
 * Flags of active spans with manual initial display.
 */
export declare const manualInitialDisplaySpans: WeakMap<Span, true>;
export type TimeToDisplayProps = {
    children?: React.ReactNode;
    record?: boolean;
};
/**
 * Component to measure time to initial display.
 *
 * The initial display is recorded when the component prop `record` is true.
 *
 * <TimeToInitialDisplay record />
 */
export declare function TimeToInitialDisplay(props: TimeToDisplayProps): React.ReactElement;
/**
 * Component to measure time to full display.
 *
 * The initial display is recorded when the component prop `record` is true.
 *
 * <TimeToInitialDisplay record />
 */
export declare function TimeToFullDisplay(props: TimeToDisplayProps): React.ReactElement;
/**
 * Starts a new span for the initial display.
 *
 * Returns current span if already exists in the currently active span.
 *
 * @deprecated Use `<TimeToInitialDisplay record={boolean}/>` component instead.
 */
export declare function startTimeToInitialDisplaySpan(options?: Omit<StartSpanOptions, 'op' | 'name'> & {
    name?: string;
    isAutoInstrumented?: boolean;
}): Span | undefined;
/**
 * Starts a new span for the full display.
 *
 * Returns current span if already exists in the currently active span.
 *
 * @deprecated Use `<TimeToFullDisplay record={boolean}/>` component instead.
 */
export declare function startTimeToFullDisplaySpan(options?: Omit<StartSpanOptions, 'op' | 'name'> & {
    name?: string;
    timeoutMs?: number;
    isAutoInstrumented?: boolean;
}): Span | undefined;
/**
 *
 */
export declare function updateInitialDisplaySpan(frameTimestampSeconds: number, { activeSpan, span, }?: {
    activeSpan?: Span;
    /**
     * Time to initial display span to update.
     */
    span?: Span;
}): void;
/**
 * Creates a new TimeToFullDisplay component which triggers the full display recording every time the component is focused.
 */
export declare function createTimeToFullDisplay({ useFocusEffect, }: {
    /**
     * `@react-navigation/native` useFocusEffect hook.
     */
    useFocusEffect: (callback: () => void) => void;
}): React.ComponentType<TimeToDisplayProps>;
/**
 * Creates a new TimeToInitialDisplay component which triggers the initial display recording every time the component is focused.
 */
export declare function createTimeToInitialDisplay({ useFocusEffect, }: {
    useFocusEffect: (callback: () => void) => void;
}): React.ComponentType<TimeToDisplayProps>;
//# sourceMappingURL=timetodisplay.d.ts.map
