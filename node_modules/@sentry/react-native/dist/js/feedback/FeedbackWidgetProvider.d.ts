import * as React from 'react';
import { Animated } from 'react-native';
import type { FeedbackWidgetStyles } from './FeedbackWidget.types';
export interface FeedbackWidgetProviderProps {
    children: React.ReactNode;
    styles?: FeedbackWidgetStyles;
}
export interface FeedbackWidgetProviderState {
    isButtonVisible: boolean;
    isScreenshotButtonVisible: boolean;
    isVisible: boolean;
    backgroundOpacity: Animated.Value;
    panY: Animated.Value;
    isScrollAtTop: boolean;
}
/**
 * FeedbackWidgetProvider is a component that wraps the feedback widget and provides
 * functionality to show and hide the widget. It also manages the visibility of the
 * feedback button and screenshot button.
 */
export declare class FeedbackWidgetProvider extends React.Component<FeedbackWidgetProviderProps> {
    state: FeedbackWidgetProviderState;
    private _themeListener;
    private _panResponder;
    constructor(props: FeedbackWidgetProviderProps);
    /**
     * Add a listener to the theme change event.
     */
    componentDidMount(): void;
    /**
     * Clean up the theme listener.
     */
    componentWillUnmount(): void;
    /**
     * Animates the background opacity when the modal is shown.
     */
    componentDidUpdate(_prevProps: any, prevState: FeedbackWidgetProviderState): void;
    /**
     * Renders the feedback form modal.
     */
    render(): React.ReactNode;
    private _handleScroll;
    private _setVisibilityFunction;
    private _setButtonVisibilityFunction;
    private _setScreenshotButtonVisibilityFunction;
    private _handleClose;
}
//# sourceMappingURL=FeedbackWidgetProvider.d.ts.map