import { AdaptedEvent } from '../interfaces';
import GestureHandler from './GestureHandler';
export default class ManualGestureHandler extends GestureHandler {
    protected onPointerDown(event: AdaptedEvent): void;
    protected onPointerAdd(event: AdaptedEvent): void;
    protected onPointerMove(event: AdaptedEvent): void;
    protected onPointerOutOfBounds(event: AdaptedEvent): void;
    protected onPointerUp(event: AdaptedEvent): void;
    protected onPointerRemove(event: AdaptedEvent): void;
}
//# sourceMappingURL=ManualGestureHandler.d.ts.map