import * as React from 'react';
import type { HostComponent } from 'react-native';
import type { RNSentryOnDrawReporterProps } from './timetodisplaynative.types';
export declare const nativeComponentExists: boolean;
/**
 * This is a fallback component for environments where the native component is not available.
 */
declare class RNSentryOnDrawReporterNoop extends React.Component<RNSentryOnDrawReporterProps> {
    render(): React.ReactNode;
}
declare let RNSentryOnDrawReporter: HostComponent<RNSentryOnDrawReporterProps> | typeof RNSentryOnDrawReporterNoop;
/**
 * Native component that reports the on draw timestamp.
 */
export declare const getRNSentryOnDrawReporter: () => typeof RNSentryOnDrawReporter;
export {};
//# sourceMappingURL=timetodisplaynative.d.ts.map