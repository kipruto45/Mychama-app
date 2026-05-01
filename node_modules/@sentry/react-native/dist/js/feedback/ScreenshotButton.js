var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as React from 'react';
import { Appearance, Image, Text, TouchableOpacity } from 'react-native';
import { NATIVE } from '../wrapper';
import { defaultScreenshotButtonConfiguration } from './defaults';
import { defaultScreenshotButtonStyles } from './FeedbackWidget.styles';
import { getTheme } from './FeedbackWidget.theme';
import { hideScreenshotButton, showFeedbackWidget } from './FeedbackWidgetManager';
import { screenshotIcon } from './icons';
import { lazyLoadFeedbackIntegration } from './lazy';
let capturedScreenshot;
const takeScreenshot = () => __awaiter(void 0, void 0, void 0, function* () {
    hideScreenshotButton();
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        const screenshots = yield NATIVE.captureScreenshot();
        if (screenshots && screenshots.length > 0) {
            capturedScreenshot = screenshots[0];
        }
        else {
            capturedScreenshot = 'ErrorCapturingScreenshot';
        }
        showFeedbackWidget();
    }), 100);
});
export const getCapturedScreenshot = () => {
    const screenshot = capturedScreenshot;
    capturedScreenshot = undefined;
    return screenshot;
};
/**
 * @beta
 * Implements a screenshot button that takes a screenshot.
 */
export class ScreenshotButton extends React.Component {
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
     * Renders the screenshot button.
     */
    render() {
        var _a, _b, _c;
        const theme = getTheme();
        const text = Object.assign(Object.assign({}, defaultScreenshotButtonConfiguration), this.props);
        const styles = {
            triggerButton: Object.assign(Object.assign({}, defaultScreenshotButtonStyles(theme).triggerButton), (_a = this.props.styles) === null || _a === void 0 ? void 0 : _a.triggerButton),
            triggerText: Object.assign(Object.assign({}, defaultScreenshotButtonStyles(theme).triggerText), (_b = this.props.styles) === null || _b === void 0 ? void 0 : _b.triggerText),
            triggerIcon: Object.assign(Object.assign({}, defaultScreenshotButtonStyles(theme).triggerIcon), (_c = this.props.styles) === null || _c === void 0 ? void 0 : _c.triggerIcon),
        };
        return (React.createElement(TouchableOpacity, { style: styles.triggerButton, onPress: takeScreenshot, accessibilityLabel: text.triggerAriaLabel },
            React.createElement(Image, { source: { uri: screenshotIcon }, style: styles.triggerIcon }),
            React.createElement(Text, { style: styles.triggerText, testID: 'sentry-feedback-screenshot-button' }, text.triggerLabel)));
    }
}
//# sourceMappingURL=ScreenshotButton.js.map