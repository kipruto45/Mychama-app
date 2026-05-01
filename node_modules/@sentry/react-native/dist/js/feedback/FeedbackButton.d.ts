import * as React from 'react';
import type { FeedbackButtonProps } from './FeedbackWidget.types';
/**
 * @beta
 * Implements a feedback button that opens the FeedbackForm.
 */
export declare class FeedbackButton extends React.Component<FeedbackButtonProps> {
    private _themeListener;
    constructor(props: FeedbackButtonProps);
    /**
     * Adds a listener for theme changes.
     */
    componentDidMount(): void;
    /**
     * Removes the theme listener.
     */
    componentWillUnmount(): void;
    /**
     * Renders the feedback button.
     */
    render(): React.ReactNode;
}
//# sourceMappingURL=FeedbackButton.d.ts.map