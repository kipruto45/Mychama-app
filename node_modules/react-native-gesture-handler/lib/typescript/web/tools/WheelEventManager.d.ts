import EventManager from './EventManager';
import { AdaptedEvent } from '../interfaces';
export default class WheelEventManager extends EventManager<HTMLElement> {
    private wheelDelta;
    private resetDelta;
    private wheelCallback;
    registerListeners(): void;
    unregisterListeners(): void;
    protected mapEvent(event: WheelEvent): AdaptedEvent;
    resetManager(): void;
}
//# sourceMappingURL=WheelEventManager.d.ts.map