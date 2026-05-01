import * as React from 'react';
import type { FeedbackWidgetProps, FeedbackWidgetState } from './FeedbackWidget.types';
/**
 * @beta
 * Implements a feedback form screen that sends feedback to Sentry using Sentry.captureFeedback.
 */
export declare class FeedbackWidget extends React.Component<FeedbackWidgetProps, FeedbackWidgetState> {
    static defaultProps: FeedbackWidgetProps;
    private static _savedState;
    private _themeListener;
    private _didSubmitForm;
    constructor(props: FeedbackWidgetProps);
    /**
     * For testing purposes only.
     */
    static reset(): void;
    handleFeedbackSubmit: () => void;
    onScreenshotButtonPress: () => void;
    /**
     * Add a listener to the theme change event.
     */
    componentDidMount(): void;
    /**
     * Save the state before unmounting the component and remove the theme listener.
     */
    componentWillUnmount(): void;
    /**
     * Renders the feedback form screen.
     */
    render(): React.ReactNode;
    private _setCapturedScreenshot;
    private _saveFormState;
    private _clearFormState;
    private _hasScreenshot;
    private _getUser;
    private _showImageRetrievalDevelopmentNote;
}
//# sourceMappingURL=FeedbackWidget.d.ts.map