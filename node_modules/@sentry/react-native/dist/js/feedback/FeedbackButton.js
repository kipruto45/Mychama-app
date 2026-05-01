import * as React from 'react';
import { Appearance, Image, Text, TouchableOpacity } from 'react-native';
import { defaultButtonConfiguration } from './defaults';
import { defaultButtonStyles } from './FeedbackWidget.styles';
import { getTheme } from './FeedbackWidget.theme';
import { showFeedbackWidget } from './FeedbackWidgetManager';
import { feedbackIcon } from './icons';
import { lazyLoadFeedbackIntegration } from './lazy';
/**
 * @beta
 * Implements a feedback button that opens the FeedbackForm.
 */
export class FeedbackButton extends React.Component {
    constructor(props) {
        super(props);
        lazyLoadFeedbackIntegration();
    }
    /**
     * Adds a listener for theme changes.
     */
    componentDidMount() {
        this._themeListener = Appearance.addChangeListener(() => {
            this.forceUpdate();
        });
    }
    /**
     * Removes the theme listener.
     */
    componentWillUnmount() {
        if (this._themeListener) {
            this._themeListener.remove();
        }
    }
    /**
     * Renders the feedback button.
     */
    render() {
        var _a, _b, _c;
        const theme = getTheme();
        const text = Object.assign(Object.assign({}, defaultButtonConfiguration), this.props);
        const styles = {
            triggerButton: Object.assign(Object.assign({}, defaultButtonStyles(theme).triggerButton), (_a = this.props.styles) === null || _a === void 0 ? void 0 : _a.triggerButton),
            triggerText: Object.assign(Object.assign({}, defaultButtonStyles(theme).triggerText), (_b = this.props.styles) === null || _b === void 0 ? void 0 : _b.triggerText),
            triggerIcon: Object.assign(Object.assign({}, defaultButtonStyles(theme).triggerIcon), (_c = this.props.styles) === null || _c === void 0 ? void 0 : _c.triggerIcon),
        };
        return (React.createElement(TouchableOpacity, { style: styles.triggerButton, onPress: showFeedbackWidget, accessibilityLabel: text.triggerAriaLabel },
            React.createElement(Image, { source: { uri: feedbackIcon }, style: styles.triggerIcon }),
            React.createElement(Text, { style: styles.triggerText, testID: "sentry-feedback-button" }, text.triggerLabel)));
    }
}
//# sourceMappingURL=FeedbackButton.js.map