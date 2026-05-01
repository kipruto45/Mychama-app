import { AdaptedEvent } from '../interfaces';
import PointerTracker from '../tools/PointerTracker';
export interface ScaleGestureListener {
    onScaleBegin: (detector: ScaleGestureDetector) => boolean;
    onScale: (detector: ScaleGestureDetector) => boolean;
    onScaleEnd: (detector: ScaleGestureDetector) => void;
}
export default class ScaleGestureDetector implements ScaleGestureListener {
    onScaleBegin: (detector: ScaleGestureDetector) => boolean;
    onScale: (detector: ScaleGestureDetector) => boolean;
    onScaleEnd: (detector: ScaleGestureDetector) => void;
    private _focusX;
    private _focusY;
    private _currentSpan;
    private prevSpan;
    private initialSpan;
    private currentTime;
    private prevTime;
    private inProgress;
    private spanSlop;
    private minSpan;
    constructor(callbacks: ScaleGestureListener);
    onTouchEvent(event: AdaptedEvent, tracker: PointerTracker): boolean;
    calculateScaleFactor(numOfPointers: number): number;
    get currentSpan(): number;
    get focusX(): number;
    get focusY(): number;
    get timeDelta(): number;
}
//# sourceMappingURL=ScaleGestureDetector.d.ts.map