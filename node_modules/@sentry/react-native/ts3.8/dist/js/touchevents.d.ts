import * as React from 'react';
export type TouchEventBoundaryProps = {
    /**
     * The category assigned to the breadcrumb that is logged by the touch event.
     */
    breadcrumbCategory?: string;
    /**
     * The type assigned to the breadcrumb that is logged by the touch event.
     */
    breadcrumbType?: string;
    /**
     * The max number of components to display when logging a touch's component tree.
     */
    maxComponentTreeSize?: number;
    /**
     * Component name(s) to ignore when logging the touch event. This prevents unhelpful logs such as
     * "Touch event within element: View" where you still can't tell which View it occurred in.
     */
    ignoreNames?: Array<string | RegExp>;
    /**
     * Deprecated, use ignoreNames instead
     * @deprecated
     */
    ignoredDisplayNames?: Array<string | RegExp>;
    /**
     * React Node wrapped by TouchEventBoundary.
     */
    children?: React.ReactNode;
    /**
     * Label Name used to identify the touched element.
     */
    labelName?: string;
};
/**
 * Boundary to log breadcrumbs for interaction events.
 */
declare class TouchEventBoundary extends React.Component<TouchEventBoundaryProps> {
    static displayName: string;
    static defaultProps: Partial<TouchEventBoundaryProps>;
    readonly name: string;
    /**
     * Registers the TouchEventBoundary as a Sentry Integration.
     */
    componentDidMount(): void;
    /**
     *
     */
    render(): React.ReactNode;
    /**
     * Logs the touch event given the component tree names and a label.
     */
    private _logTouchEvent;
    /**
     * Checks if the name is supposed to be ignored.
     */
    private _isNameIgnored;
    /**
     * Traverses through the component tree when a touch happens and logs it.
     * @param e
     */
    private _onTouchStart;
    /**
     * Pushes the name to the componentTreeNames array if it is not ignored.
     */
    private _pushIfNotIgnored;
}
/**
 * Convenience Higher-Order-Component for TouchEventBoundary
 * @param WrappedComponent any React Component
 * @param boundaryProps TouchEventBoundaryProps
 */
declare const withTouchEventBoundary: (InnerComponent: React.ComponentType<any>, boundaryProps?: TouchEventBoundaryProps) => React.FunctionComponent;
export { TouchEventBoundary, withTouchEventBoundary };
//# sourceMappingURL=touchevents.d.ts.map
