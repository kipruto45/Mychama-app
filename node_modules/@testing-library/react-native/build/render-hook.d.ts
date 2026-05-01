import * as React from 'react';
import type { RefObject } from './types';
export type RenderHookResult<Result, Props> = {
    result: RefObject<Result>;
    rerender: (props: Props) => void;
    unmount: () => void;
};
export type RenderHookAsyncResult<Result, Props> = {
    result: RefObject<Result>;
    rerenderAsync: (props: Props) => Promise<void>;
    unmountAsync: () => Promise<void>;
};
export type RenderHookOptions<Props> = {
    /**
     * The initial props to pass to the hook.
     */
    initialProps?: Props;
    /**
     * Pass a React Component as the wrapper option to have it rendered around the inner element. This is most useful for creating
     * reusable custom render functions for common data providers.
     */
    wrapper?: React.ComponentType<any>;
    /**
     * Set to `false` to disable concurrent rendering.
     * Otherwise `renderHook` will default to concurrent rendering.
     */
    concurrentRoot?: boolean;
};
export declare function renderHook<Result, Props>(hookToRender: (props: Props) => Result, options?: RenderHookOptions<NoInfer<Props>>): RenderHookResult<Result, Props>;
export declare function renderHookAsync<Result, Props>(hookToRender: (props: Props) => Result, options?: RenderHookOptions<NoInfer<Props>>): Promise<RenderHookAsyncResult<Result, Props>>;
