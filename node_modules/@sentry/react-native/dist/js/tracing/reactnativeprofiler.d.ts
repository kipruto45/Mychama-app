import { Profiler } from '@sentry/react';
type ProfilerConstructorProps = ConstructorParameters<typeof Profiler>[0];
/**
 * Custom profiler for the React Native app root.
 */
export declare class ReactNativeProfiler extends Profiler {
    readonly name: string;
    constructor(props: ProfilerConstructorProps);
    /**
     * Get the app root mount time.
     */
    componentDidMount(): void;
    /**
     * Notifies the Tracing integration that the app start has finished.
     */
    private _reportAppStart;
}
export {};
//# sourceMappingURL=reactnativeprofiler.d.ts.map