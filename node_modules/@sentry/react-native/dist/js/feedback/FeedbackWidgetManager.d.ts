export declare const PULL_DOWN_CLOSE_THRESHOLD = 200;
export declare const SLIDE_ANIMATION_DURATION = 200;
export declare const BACKGROUND_ANIMATION_DURATION = 200;
declare abstract class FeedbackManager {
    protected static _isVisible: boolean;
    protected static _setVisibility: (visible: boolean) => void;
    protected static get _feedbackComponentName(): string;
    static initialize(setVisibility: (visible: boolean) => void): void;
    /**
     * For testing purposes only.
     */
    static reset(): void;
    static show(): void;
    static hide(): void;
    static isFormVisible(): boolean;
}
/**
 * Provides functionality to show and hide the feedback widget.
 */
export declare class FeedbackWidgetManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    protected static get _feedbackComponentName(): string;
}
/**
 * Provides functionality to show and hide the feedback button.
 */
export declare class FeedbackButtonManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    protected static get _feedbackComponentName(): string;
}
/**
 * Provides functionality to show and hide the screenshot button.
 */
export declare class ScreenshotButtonManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    protected static get _feedbackComponentName(): string;
}
declare const showFeedbackWidget: () => void;
declare const resetFeedbackWidgetManager: () => void;
declare const showFeedbackButton: () => void;
declare const hideFeedbackButton: () => void;
declare const resetFeedbackButtonManager: () => void;
declare const showScreenshotButton: () => void;
declare const hideScreenshotButton: () => void;
declare const resetScreenshotButtonManager: () => void;
export { showFeedbackButton, hideFeedbackButton, showFeedbackWidget, showScreenshotButton, hideScreenshotButton, resetFeedbackButtonManager, resetFeedbackWidgetManager, resetScreenshotButtonManager };
//# sourceMappingURL=FeedbackWidgetManager.d.ts.map