import { Insets } from 'react-native';
import { HoverGestureHandlerEventPayload, LongPressGestureHandlerEventPayload } from '../../handlers/GestureHandlerEventPayload';
import { GestureStateChangeEvent, GestureTouchEvent } from '../../handlers/gestureHandlerCommon';
import { PressableDimensions, InnerPressableEvent, PressableEvent } from './PressableProps';
declare const numberAsInset: (value: number) => Insets;
declare const addInsets: (a: Insets, b: Insets) => Insets;
declare const isTouchWithinInset: (dimensions: PressableDimensions, inset: Insets, touch?: InnerPressableEvent) => boolean;
declare const gestureToPressableEvent: (event: GestureStateChangeEvent<HoverGestureHandlerEventPayload | LongPressGestureHandlerEventPayload>) => PressableEvent;
declare const gestureTouchToPressableEvent: (event: GestureTouchEvent) => PressableEvent;
export { numberAsInset, addInsets, isTouchWithinInset, gestureToPressableEvent, gestureTouchToPressableEvent, };
//# sourceMappingURL=utils.d.ts.map