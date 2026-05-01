import type { ReactTestInstance } from 'react-test-renderer';
import type { Size } from '../../types';
import type { UserEventInstance } from '../setup';
interface CommonScrollToOptions {
    contentSize?: Size;
    layoutMeasurement?: Size;
}
export interface VerticalScrollToOptions extends CommonScrollToOptions {
    y: number;
    momentumY?: number;
    x?: never;
    momentumX?: never;
}
export interface HorizontalScrollToOptions extends CommonScrollToOptions {
    x: number;
    momentumX?: number;
    y?: never;
    momentumY?: never;
}
export type ScrollToOptions = VerticalScrollToOptions | HorizontalScrollToOptions;
export declare function scrollTo(this: UserEventInstance, element: ReactTestInstance, options: ScrollToOptions): Promise<void>;
export {};
