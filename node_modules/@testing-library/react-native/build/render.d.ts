import * as React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import type { DebugOptions } from './helpers/debug';
export interface RenderOptions {
    /**
     * Pass a React Component as the wrapper option to have it rendered around the inner element. This is most useful for creating
     * reusable custom render functions for common data providers.
     */
    wrapper?: React.ComponentType<any>;
    /**
     * Set to `false` to disable concurrent rendering.
     * Otherwise `render` will default to concurrent rendering.
     */
    concurrentRoot?: boolean;
    createNodeMock?: (element: React.ReactElement) => unknown;
    unstable_validateStringsRenderedWithinText?: boolean;
}
export type RenderResult = ReturnType<typeof render>;
/**
 * Renders test component deeply using React Test Renderer and exposes helpers
 * to assert on the output.
 */
export default function render<T>(component: React.ReactElement<T>, options?: RenderOptions): {
    rerender: (component: React.ReactElement) => void;
    rerenderAsync: (component: React.ReactElement) => Promise<void>;
    update: (component: React.ReactElement) => void;
    updateAsync: (component: React.ReactElement) => Promise<void>;
    unmount: () => void;
    unmountAsync: () => Promise<void>;
    toJSON: () => null | import("react-test-renderer").ReactTestRendererJSON | import("react-test-renderer").ReactTestRendererJSON[];
    debug: DebugFunction;
    root: ReactTestInstance;
    UNSAFE_root: ReactTestInstance;
    UNSAFE_getByProps: (props: {
        [x: string]: unknown;
    }) => ReactTestInstance;
    UNSAFE_getAllByProps: (props: {
        [x: string]: unknown;
    }) => Array<ReactTestInstance>;
    UNSAFE_queryByProps: (props: {
        [x: string]: unknown;
    }) => ReactTestInstance | null;
    UNSAFE_queryAllByProps: (props: {
        [x: string]: unknown;
    }) => Array<ReactTestInstance>;
    UNSAFE_getByType: <P>(type: React.ComponentType<P>) => ReactTestInstance;
    UNSAFE_getAllByType: <P>(type: React.ComponentType<P>) => Array<ReactTestInstance>;
    UNSAFE_queryByType: <P>(type: React.ComponentType<P>) => ReactTestInstance | null;
    UNSAFE_queryAllByType: <P>(type: React.ComponentType<P>) => Array<ReactTestInstance>;
    getByRole: import("./queries/make-queries").GetByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    getAllByRole: import("./queries/make-queries").GetAllByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    queryByRole: import("./queries/make-queries").QueryByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    queryAllByRole: import("./queries/make-queries").QueryAllByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    findByRole: import("./queries/make-queries").FindByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    findAllByRole: import("./queries/make-queries").FindAllByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    getByHintText: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByHintText: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByHintText: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByHintText: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByHintText: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByHintText: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByA11yHint: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByA11yHint: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByA11yHint: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByA11yHint: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByA11yHint: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByA11yHint: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByAccessibilityHint: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByAccessibilityHint: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByAccessibilityHint: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByAccessibilityHint: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByAccessibilityHint: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByAccessibilityHint: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByLabelText: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByLabelText: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByLabelText: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByLabelText: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByLabelText: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByLabelText: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByPlaceholderText: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByPlaceholderText: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByPlaceholderText: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByPlaceholderText: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByPlaceholderText: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByPlaceholderText: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByDisplayValue: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByDisplayValue: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByDisplayValue: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByDisplayValue: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByDisplayValue: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByDisplayValue: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByTestId: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByTestId: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByTestId: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByTestId: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByTestId: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByTestId: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByText: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByText: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByText: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByText: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByText: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByText: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
};
export declare function renderInternal<T>(component: React.ReactElement<T>, options?: RenderOptions): {
    rerender: (component: React.ReactElement) => void;
    rerenderAsync: (component: React.ReactElement) => Promise<void>;
    update: (component: React.ReactElement) => void;
    updateAsync: (component: React.ReactElement) => Promise<void>;
    unmount: () => void;
    unmountAsync: () => Promise<void>;
    toJSON: () => null | import("react-test-renderer").ReactTestRendererJSON | import("react-test-renderer").ReactTestRendererJSON[];
    debug: DebugFunction;
    root: ReactTestInstance;
    UNSAFE_root: ReactTestInstance;
    UNSAFE_getByProps: (props: {
        [x: string]: unknown;
    }) => ReactTestInstance;
    UNSAFE_getAllByProps: (props: {
        [x: string]: unknown;
    }) => Array<ReactTestInstance>;
    UNSAFE_queryByProps: (props: {
        [x: string]: unknown;
    }) => ReactTestInstance | null;
    UNSAFE_queryAllByProps: (props: {
        [x: string]: unknown;
    }) => Array<ReactTestInstance>;
    UNSAFE_getByType: <P>(type: React.ComponentType<P>) => ReactTestInstance;
    UNSAFE_getAllByType: <P>(type: React.ComponentType<P>) => Array<ReactTestInstance>;
    UNSAFE_queryByType: <P>(type: React.ComponentType<P>) => ReactTestInstance | null;
    UNSAFE_queryAllByType: <P>(type: React.ComponentType<P>) => Array<ReactTestInstance>;
    getByRole: import("./queries/make-queries").GetByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    getAllByRole: import("./queries/make-queries").GetAllByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    queryByRole: import("./queries/make-queries").QueryByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    queryAllByRole: import("./queries/make-queries").QueryAllByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    findByRole: import("./queries/make-queries").FindByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    findAllByRole: import("./queries/make-queries").FindAllByQuery<import("./queries/role").ByRoleMatcher, import("./queries/role").ByRoleOptions>;
    getByHintText: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByHintText: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByHintText: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByHintText: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByHintText: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByHintText: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByA11yHint: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByA11yHint: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByA11yHint: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByA11yHint: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByA11yHint: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByA11yHint: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByAccessibilityHint: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByAccessibilityHint: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByAccessibilityHint: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByAccessibilityHint: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByAccessibilityHint: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByAccessibilityHint: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByLabelText: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByLabelText: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByLabelText: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByLabelText: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByLabelText: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByLabelText: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByPlaceholderText: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByPlaceholderText: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByPlaceholderText: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByPlaceholderText: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByPlaceholderText: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByPlaceholderText: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByDisplayValue: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByDisplayValue: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByDisplayValue: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByDisplayValue: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByDisplayValue: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByDisplayValue: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByTestId: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByTestId: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByTestId: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByTestId: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByTestId: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByTestId: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getByText: import("./queries/make-queries").GetByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    getAllByText: import("./queries/make-queries").GetAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryByText: import("./queries/make-queries").QueryByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    queryAllByText: import("./queries/make-queries").QueryAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findByText: import("./queries/make-queries").FindByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
    findAllByText: import("./queries/make-queries").FindAllByQuery<import("./matches").TextMatch, import("./queries/options").CommonQueryOptions & import("./matches").TextMatchOptions>;
};
export type DebugFunction = (options?: DebugOptions) => void;
