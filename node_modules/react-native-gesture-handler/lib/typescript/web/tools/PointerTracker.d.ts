import { AdaptedEvent, Point } from '../interfaces';
export interface TrackerElement {
    abosoluteCoords: Point;
    relativeCoords: Point;
    timestamp: number;
    velocityX: number;
    velocityY: number;
}
export default class PointerTracker {
    private velocityTracker;
    private readonly _trackedPointers;
    private touchEventsIds;
    private lastMovedPointerId;
    private cachedAbsoluteAverages;
    private cachedRelativeAverages;
    constructor();
    addToTracker(event: AdaptedEvent): void;
    removeFromTracker(pointerId: number): void;
    track(event: AdaptedEvent): void;
    private mapTouchEventId;
    private removeMappedTouchId;
    getMappedTouchEventId(touchEventId: number): number;
    getVelocity(pointerId: number): {
        x: number;
        y: number;
    } | null;
    getLastAbsoluteCoords(pointerId?: number): Point | undefined;
    getLastRelativeCoords(pointerId?: number): Point | undefined;
    getAbsoluteCoordsAverage(): {
        x: number;
        y: number;
    };
    getRelativeCoordsAverage(): {
        x: number;
        y: number;
    };
    getAbsoluteCoordsSum(ignoredPointer?: number): {
        x: number;
        y: number;
    };
    getRelativeCoordsSum(ignoredPointer?: number): {
        x: number;
        y: number;
    };
    resetTracker(): void;
    static shareCommonPointers(stPointers: number[], ndPointers: number[]): boolean;
    get trackedPointersCount(): number;
    get trackedPointersIDs(): number[];
    get trackedPointers(): Map<number, TrackerElement>;
}
//# sourceMappingURL=PointerTracker.d.ts.map