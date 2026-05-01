import { AdaptedEvent } from '../interfaces';
export default class VelocityTracker {
    private assumePointerMoveStoppedMilliseconds;
    private historySize;
    private horizonMilliseconds;
    private minSampleSize;
    private samples;
    constructor();
    add(event: AdaptedEvent): void;
    private getVelocityEstimate;
    get velocity(): [number, number];
    reset(): void;
}
//# sourceMappingURL=VelocityTracker.d.ts.map