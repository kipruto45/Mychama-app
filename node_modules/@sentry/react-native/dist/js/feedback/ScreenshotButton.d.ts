import * as React from 'react';
import type { Screenshot } from '../wrapper';
import type { ScreenshotButtonProps } from './FeedbackWidget.types';
export declare const getCapturedScreenshot: () => Screenshot | 'ErrorCapturingScreenshot' | undefined;
/**
 * @beta
 * Implements a screenshot button that takes a screenshot.
 */
export declare class ScreenshotButton extends React.Component<ScreenshotButtonProps> {
    private _themeListener;
    constructor(props: ScreenshotButtonProps);
    /**
     * Adds a listener for theme changes.
     */
    componentDidMount(): void;
    /**
     * Removes the theme listener.
     */
    componentWillUnmount(): void;
    /**
     * Renders the screenshot button.
     */
    render(): React.ReactNode;
}
//# sourceMappingURL=ScreenshotButton.d.ts.map