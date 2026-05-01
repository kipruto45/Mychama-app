import { AdaptedEvent, EventTypes } from '../interfaces';
import EventManager from './EventManager';
export default class KeyboardEventManager extends EventManager<HTMLElement> {
    private static activationKeys;
    private static cancelationKeys;
    private isPressed;
    private static registeredStaticListeners;
    private static instances;
    private static keyUpStaticCallback;
    private keyDownCallback;
    private onKeyUp;
    private dispatchEvent;
    registerListeners(): void;
    unregisterListeners(): void;
    protected mapEvent(event: KeyboardEvent, eventType: EventTypes): AdaptedEvent;
}
//# sourceMappingURL=KeyboardEventManager.d.ts.map