import { AdaptedEvent } from '../interfaces';
import GestureHandler from './GestureHandler';
export default class HoverGestureHandler extends GestureHandler {
    private stylusData;
    protected transformNativeEvent(): Record<string, unknown>;
    protected onPointerMoveOver(event: AdaptedEvent): void;
    protected onPointerMoveOut(event: AdaptedEvent): void;
    protected onPointerMove(event: AdaptedEvent): void;
    protected onPointerCancel(event: AdaptedEvent): void;
}
//# sourceMappingURL=HoverGestureHandler.d.ts.map