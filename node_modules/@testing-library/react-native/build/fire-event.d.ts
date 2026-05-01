import type { PressableProps, ScrollViewProps, TextInputProps, TextProps, ViewProps } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import type { StringWithAutocomplete } from './types';
export declare function isTouchResponder(element: ReactTestInstance): boolean;
export declare function isEventEnabled(element: ReactTestInstance, eventName: string, nearestTouchResponder?: ReactTestInstance): boolean;
type EventNameExtractor<T> = keyof {
    [K in keyof T as K extends `on${infer Rest}` ? Uncapitalize<Rest> : never]: T[K];
};
type EventName = StringWithAutocomplete<EventNameExtractor<ViewProps> | EventNameExtractor<TextProps> | EventNameExtractor<TextInputProps> | EventNameExtractor<PressableProps> | EventNameExtractor<ScrollViewProps>>;
declare function fireEvent(element: ReactTestInstance, eventName: EventName, ...data: unknown[]): undefined;
declare namespace fireEvent {
    var press: (element: ReactTestInstance, ...data: unknown[]) => undefined;
    var changeText: (element: ReactTestInstance, ...data: unknown[]) => undefined;
    var scroll: (element: ReactTestInstance, ...data: unknown[]) => undefined;
}
declare function fireEventAsync(element: ReactTestInstance, eventName: EventName, ...data: unknown[]): Promise<undefined>;
declare namespace fireEventAsync {
    var press: (element: ReactTestInstance, ...data: unknown[]) => Promise<undefined>;
    var changeText: (element: ReactTestInstance, ...data: unknown[]) => Promise<undefined>;
    var scroll: (element: ReactTestInstance, ...data: unknown[]) => Promise<undefined>;
}
export { fireEventAsync };
export default fireEvent;
