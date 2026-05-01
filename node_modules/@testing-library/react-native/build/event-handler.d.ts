import type { ReactTestInstance } from 'react-test-renderer';
export type EventHandlerOptions = {
    /** Include check for event handler named without adding `on*` prefix. */
    loose?: boolean;
};
export declare function getEventHandler(element: ReactTestInstance, eventName: string, options?: EventHandlerOptions): any;
export declare function getEventHandlerName(eventName: string): string;
