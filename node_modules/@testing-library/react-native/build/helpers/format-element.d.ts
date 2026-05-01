import type { ReactTestInstance, ReactTestRendererJSON } from 'react-test-renderer';
import type { MapPropsFunction } from './map-props';
export type FormatElementOptions = {
    /** Minimize used space. */
    compact?: boolean;
    /** Highlight the output. */
    highlight?: boolean;
    /** Filter or map props to display. */
    mapProps?: MapPropsFunction | null;
};
/***
 * Format given element as a pretty-printed string.
 *
 * @param element Element to format.
 */
export declare function formatElement(element: ReactTestInstance | null, { compact, highlight, mapProps }?: FormatElementOptions): string;
export declare function formatElementList(elements: ReactTestInstance[], options?: FormatElementOptions): string;
export declare function formatJson(json: ReactTestRendererJSON | ReactTestRendererJSON[], { compact, highlight, mapProps }?: FormatElementOptions): string;
