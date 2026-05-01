import { debug } from '@sentry/core';
import { isWeb } from '../utils/environment';
import { lazyLoadAutoInjectFeedbackButtonIntegration, lazyLoadAutoInjectFeedbackIntegration, lazyLoadAutoInjectScreenshotButtonIntegration } from './lazy';
export const PULL_DOWN_CLOSE_THRESHOLD = 200;
export const SLIDE_ANIMATION_DURATION = 200;
export const BACKGROUND_ANIMATION_DURATION = 200;
const NOOP_SET_VISIBILITY = () => {
    // No-op
};
class FeedbackManager {
    static get _feedbackComponentName() {
        throw new Error('Subclasses must override feedbackComponentName');
    }
    static initialize(setVisibility) {
        this._setVisibility = setVisibility;
    }
    /**
     * For testing purposes only.
     */
    static reset() {
        this._isVisible = false;
        this._setVisibility = NOOP_SET_VISIBILITY;
    }
    static show() {
        if (this._setVisibility !== NOOP_SET_VISIBILITY) {
            this._isVisible = true;
            this._setVisibility(true);
        }
        else {
            // This message should be always shown otherwise it's not possible to use the widget.
            // eslint-disable-next-line no-console
            console.warn(`[Sentry] ${this._feedbackComponentName} requires 'Sentry.wrap(RootComponent)' to be called before 'show${this._feedbackComponentName}()'.`);
        }
    }
    static hide() {
        if (this._setVisibility !== NOOP_SET_VISIBILITY) {
            this._isVisible = false;
            this._setVisibility(false);
        }
        else {
            // This message should be always shown otherwise it's not possible to use the widget.
            // eslint-disable-next-line no-console
            console.warn(`[Sentry] ${this._feedbackComponentName} requires 'Sentry.wrap(RootComponent)' before interacting with the widget.`);
        }
    }
    static isFormVisible() {
        return this._isVisible;
    }
}
FeedbackManager._isVisible = false;
/**
 * Provides functionality to show and hide the feedback widget.
 */
export class FeedbackWidgetManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    static get _feedbackComponentName() {
        return 'FeedbackWidget';
    }
}
/**
 * Provides functionality to show and hide the feedback button.
 */
export class FeedbackButtonManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    static get _feedbackComponentName() {
        return 'FeedbackButton';
    }
}
/**
 * Provides functionality to show and hide the screenshot button.
 */
export class ScreenshotButtonManager extends FeedbackManager {
    /**
     * Returns the name of the feedback component.
     */
    static get _feedbackComponentName() {
        return 'ScreenshotButton';
    }
}
const showFeedbackWidget = () => {
    lazyLoadAutoInjectFeedbackIntegration();
    FeedbackWidgetManager.show();
};
const resetFeedbackWidgetManager = () => {
    FeedbackWidgetManager.reset();
};
const showFeedbackButton = () => {
    lazyLoadAutoInjectFeedbackButtonIntegration();
    FeedbackButtonManager.show();
};
const hideFeedbackButton = () => {
    FeedbackButtonManager.hide();
};
const resetFeedbackButtonManager = () => {
    FeedbackButtonManager.reset();
};
const showScreenshotButton = () => {
    if (isWeb()) {
        debug.warn('ScreenshotButton is not supported on Web.');
        return;
    }
    lazyLoadAutoInjectScreenshotButtonIntegration();
    ScreenshotButtonManager.show();
};
const hideScreenshotButton = () => {
    ScreenshotButtonManager.hide();
};
const resetScreenshotButtonManager = () => {
    ScreenshotButtonManager.reset();
};
export { showFeedbackButton, hideFeedbackButton, showFeedbackWidget, showScreenshotButton, hideScreenshotButton, resetFeedbackButtonManager, resetFeedbackWidgetManager, resetScreenshotButtonManager };
//# sourceMappingURL=FeedbackWidgetManager.js.map