/// <reference types="react" />
export interface RNSentryOnDrawNextFrameEvent {
    newFrameTimestampInSeconds: number;
    type: 'initialDisplay' | 'fullDisplay';
}
export interface RNSentryOnDrawReporterProps {
    children?: React.ReactNode;
    initialDisplay?: boolean;
    fullDisplay?: boolean;
    parentSpanId?: string;
}
//# sourceMappingURL=timetodisplaynative.types.d.ts.map
