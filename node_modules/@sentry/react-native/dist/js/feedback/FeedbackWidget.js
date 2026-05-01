var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { captureFeedback, debug, getCurrentScope, getGlobalScope, getIsolationScope, lastEventId } from '@sentry/core';
import * as React from 'react';
import { Appearance, Image, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { isExpoGo, isWeb, notWeb } from '../utils/environment';
import { getDataFromUri, NATIVE } from '../wrapper';
import { sentryLogo } from './branding';
import { defaultConfiguration } from './defaults';
import defaultStyles from './FeedbackWidget.styles';
import { getTheme } from './FeedbackWidget.theme';
import { hideFeedbackButton, showScreenshotButton } from './FeedbackWidgetManager';
import { lazyLoadFeedbackIntegration } from './lazy';
import { getCapturedScreenshot } from './ScreenshotButton';
import { base64ToUint8Array, feedbackAlertDialog, isValidEmail } from './utils';
/**
 * @beta
 * Implements a feedback form screen that sends feedback to Sentry using Sentry.captureFeedback.
 */
export class FeedbackWidget extends React.Component {
    constructor(props) {
        var _a, _b, _c, _d, _e, _f;
        super(props);
        this._didSubmitForm = false;
        this.handleFeedbackSubmit = () => {
            const { name, email, description } = this.state;
            const { onSubmitSuccess, onSubmitError, onFormSubmitted } = this.props;
            const text = this.props;
            const trimmedName = name === null || name === void 0 ? void 0 : name.trim();
            const trimmedEmail = email === null || email === void 0 ? void 0 : email.trim();
            const trimmedDescription = description === null || description === void 0 ? void 0 : description.trim();
            if ((this.props.isNameRequired && !trimmedName) ||
                (this.props.isEmailRequired && !trimmedEmail) ||
                !trimmedDescription) {
                feedbackAlertDialog(text.errorTitle, text.formError);
                return;
            }
            if (this.props.shouldValidateEmail &&
                (this.props.isEmailRequired || trimmedEmail.length > 0) &&
                !isValidEmail(trimmedEmail)) {
                feedbackAlertDialog(text.errorTitle, text.emailError);
                return;
            }
            const attachments = this.state.filename && this.state.attachment
                ? [
                    {
                        filename: this.state.filename,
                        data: this.state.attachment,
                    },
                ]
                : undefined;
            const eventId = lastEventId();
            const userFeedback = {
                message: trimmedDescription,
                name: trimmedName,
                email: trimmedEmail,
                associatedEventId: eventId,
            };
            try {
                if (!onFormSubmitted) {
                    this.setState({ isVisible: false });
                }
                captureFeedback(userFeedback, attachments ? { attachments } : undefined);
                onSubmitSuccess({
                    name: trimmedName,
                    email: trimmedEmail,
                    message: trimmedDescription,
                    attachments: attachments,
                });
                feedbackAlertDialog(text.successMessageText, '');
                onFormSubmitted();
                this._didSubmitForm = true;
            }
            catch (error) {
                const errorString = `Feedback form submission failed: ${error}`;
                onSubmitError(new Error(errorString));
                feedbackAlertDialog(text.errorTitle, text.genericError);
                debug.error(`Feedback form submission failed: ${error}`);
            }
        };
        this.onScreenshotButtonPress = () => __awaiter(this, void 0, void 0, function* () {
            var _g, _h, _j, _k, _l;
            if (!this._hasScreenshot()) {
                const { imagePicker } = this.props;
                if (imagePicker) {
                    const launchImageLibrary = imagePicker.launchImageLibraryAsync
                        ? // expo-image-picker library is available
                            () => { var _a; return (_a = imagePicker.launchImageLibraryAsync) === null || _a === void 0 ? void 0 : _a.call(imagePicker, { mediaTypes: ['images'], base64: isWeb() }); }
                        : // react-native-image-picker library is available
                            imagePicker.launchImageLibrary
                                ? () => { var _a; return (_a = imagePicker.launchImageLibrary) === null || _a === void 0 ? void 0 : _a.call(imagePicker, { mediaType: 'photo', includeBase64: isWeb() }); }
                                : null;
                    if (!launchImageLibrary) {
                        debug.warn('No compatible image picker library found. Please provide a valid image picker library.');
                        if (__DEV__) {
                            feedbackAlertDialog('Development note', 'No compatible image picker library found. Please provide a compatible version of `expo-image-picker` or `react-native-image-picker`.');
                        }
                        return;
                    }
                    const result = yield launchImageLibrary();
                    if ((result === null || result === void 0 ? void 0 : result.assets) && result.assets.length > 0) {
                        if (isWeb()) {
                            const filename = (_g = result.assets[0]) === null || _g === void 0 ? void 0 : _g.fileName;
                            const imageUri = (_h = result.assets[0]) === null || _h === void 0 ? void 0 : _h.uri;
                            const base64 = (_j = result.assets[0]) === null || _j === void 0 ? void 0 : _j.base64;
                            const data = base64 ? base64ToUint8Array(base64) : undefined;
                            if (data) {
                                this.setState({ filename, attachment: data, attachmentUri: imageUri });
                            }
                            else {
                                debug.error('Failed to read image data on the web');
                            }
                        }
                        else {
                            const filename = (_k = result.assets[0]) === null || _k === void 0 ? void 0 : _k.fileName;
                            const imageUri = (_l = result.assets[0]) === null || _l === void 0 ? void 0 : _l.uri;
                            imageUri &&
                                getDataFromUri(imageUri)
                                    .then((data) => {
                                    if (data != null) {
                                        this.setState({ filename, attachment: data, attachmentUri: imageUri });
                                    }
                                    else {
                                        this._showImageRetrievalDevelopmentNote();
                                        debug.error('Failed to read image data from uri:', imageUri);
                                    }
                                })
                                    .catch((error) => {
                                    this._showImageRetrievalDevelopmentNote();
                                    debug.error('Failed to read image data from uri:', imageUri, 'error: ', error);
                                });
                        }
                    }
                }
                else {
                    // Defaulting to the onAddScreenshot callback
                    const { onAddScreenshot } = Object.assign(Object.assign({}, defaultConfiguration), this.props);
                    onAddScreenshot((uri) => {
                        getDataFromUri(uri).then((data) => {
                            if (data != null) {
                                this.setState({ filename: 'feedback_screenshot', attachment: data, attachmentUri: uri });
                            }
                            else {
                                this._showImageRetrievalDevelopmentNote();
                                debug.error('Failed to read image data from uri:', uri);
                            }
                        }).catch((error) => {
                            this._showImageRetrievalDevelopmentNote();
                            debug.error('Failed to read image data from uri:', uri, 'error: ', error);
                        });
                    });
                }
            }
            else {
                this.setState({ filename: undefined, attachment: undefined, attachmentUri: undefined });
            }
        });
        this._setCapturedScreenshot = (screenshot) => {
            if (screenshot.data != null) {
                debug.log('Setting captured screenshot:', screenshot.filename);
                NATIVE.encodeToBase64(screenshot.data)
                    .then(base64String => {
                    if (base64String != null) {
                        const dataUri = `data:${screenshot.contentType};base64,${base64String}`;
                        this.setState({ filename: screenshot.filename, attachment: screenshot.data, attachmentUri: dataUri });
                    }
                    else {
                        debug.error('Failed to read image data from:', screenshot.filename);
                    }
                })
                    .catch(error => {
                    debug.error('Failed to read image data from:', screenshot.filename, 'error: ', error);
                });
            }
            else {
                debug.error('Failed to read image data from:', screenshot.filename);
            }
        };
        this._saveFormState = () => {
            FeedbackWidget._savedState = Object.assign({}, this.state);
        };
        this._clearFormState = () => {
            FeedbackWidget._savedState = {
                name: '',
                email: '',
                description: '',
                filename: undefined,
                attachment: undefined,
                attachmentUri: undefined,
            };
        };
        this._hasScreenshot = () => {
            return this.state.filename !== undefined && this.state.attachment !== undefined && this.state.attachmentUri !== undefined;
        };
        this._getUser = () => {
            const currentUser = getCurrentScope().getUser();
            if (currentUser) {
                return currentUser;
            }
            const isolationUser = getIsolationScope().getUser();
            if (isolationUser) {
                return isolationUser;
            }
            return getGlobalScope().getUser();
        };
        this._showImageRetrievalDevelopmentNote = () => {
            if (isExpoGo()) {
                feedbackAlertDialog('Development note', 'The feedback widget cannot retrieve image data in Expo Go. Please build your app to test this functionality.');
            }
        };
        const currentUser = {
            useSentryUser: {
                email: ((_b = (_a = this.props) === null || _a === void 0 ? void 0 : _a.useSentryUser) === null || _b === void 0 ? void 0 : _b.email) || ((_c = this._getUser()) === null || _c === void 0 ? void 0 : _c.email) || '',
                name: ((_e = (_d = this.props) === null || _d === void 0 ? void 0 : _d.useSentryUser) === null || _e === void 0 ? void 0 : _e.name) || ((_f = this._getUser()) === null || _f === void 0 ? void 0 : _f.name) || '',
            }
        };
        this.state = {
            isVisible: true,
            name: FeedbackWidget._savedState.name || currentUser.useSentryUser.name,
            email: FeedbackWidget._savedState.email || currentUser.useSentryUser.email,
            description: FeedbackWidget._savedState.description || '',
            filename: FeedbackWidget._savedState.filename || undefined,
            attachment: FeedbackWidget._savedState.attachment || undefined,
            attachmentUri: FeedbackWidget._savedState.attachmentUri || undefined,
        };
        lazyLoadFeedbackIntegration();
    }
    /**
     * For testing purposes only.
     */
    static reset() {
        FeedbackWidget._savedState = {
            name: '',
            email: '',
            description: '',
            filename: undefined,
            attachment: undefined,
            attachmentUri: undefined,
        };
    }
    /**
     * Add a listener to the theme change event.
     */
    componentDidMount() {
        this._themeListener = Appearance.addChangeListener(() => {
            this.forceUpdate();
        });
    }
    /**
     * Save the state before unmounting the component and remove the theme listener.
     */
    componentWillUnmount() {
        if (this._didSubmitForm) {
            this._clearFormState();
            this._didSubmitForm = false;
        }
        else {
            this._saveFormState();
        }
        if (this._themeListener) {
            this._themeListener.remove();
        }
    }
    /**
     * Renders the feedback form screen.
     */
    render() {
        const theme = getTheme();
        const { name, email, description } = this.state;
        const { onFormClose } = this.props;
        const config = this.props;
        const imagePickerConfiguration = this.props;
        const text = this.props;
        const styles = Object.assign(Object.assign({}, defaultStyles(theme)), this.props.styles);
        const onCancel = () => {
            if (onFormClose) {
                onFormClose();
            }
            else {
                this.setState({ isVisible: false });
            }
        };
        if (!this.state.isVisible) {
            return null;
        }
        const screenshot = getCapturedScreenshot();
        if (screenshot === 'ErrorCapturingScreenshot') {
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                feedbackAlertDialog(text.errorTitle, text.captureScreenshotError);
            }), 100);
        }
        else if (screenshot) {
            this._setCapturedScreenshot(screenshot);
        }
        return (React.createElement(TouchableWithoutFeedback, { onPress: notWeb() ? Keyboard.dismiss : undefined, accessible: false, accessibilityElementsHidden: false },
            React.createElement(View, { style: styles.container },
                React.createElement(View, { style: styles.titleContainer },
                    React.createElement(Text, { style: styles.title, testID: "sentry-feedback-form-title" }, text.formTitle),
                    config.showBranding && (React.createElement(Image, { source: { uri: sentryLogo }, style: styles.sentryLogo, testID: "sentry-logo" }))),
                config.showName && (React.createElement(React.Fragment, null,
                    React.createElement(Text, { style: styles.label },
                        text.nameLabel,
                        config.isNameRequired && ` ${text.isRequiredLabel}`),
                    React.createElement(TextInput, { style: styles.input, testID: "sentry-feedback-name-input", placeholder: text.namePlaceholder, value: name, onChangeText: value => this.setState({ name: value }) }))),
                config.showEmail && (React.createElement(React.Fragment, null,
                    React.createElement(Text, { style: styles.label },
                        text.emailLabel,
                        config.isEmailRequired && ` ${text.isRequiredLabel}`),
                    React.createElement(TextInput, { style: styles.input, testID: "sentry-feedback-email-input", placeholder: text.emailPlaceholder, keyboardType: 'email-address', value: email, onChangeText: value => this.setState({ email: value }) }))),
                React.createElement(Text, { style: styles.label },
                    text.messageLabel,
                    ` ${text.isRequiredLabel}`),
                React.createElement(TextInput, { style: [styles.input, styles.textArea], testID: "sentry-feedback-message-input", placeholder: text.messagePlaceholder, value: description, onChangeText: value => this.setState({ description: value }), multiline: true }),
                (config.enableScreenshot || imagePickerConfiguration.imagePicker || this._hasScreenshot()) && (React.createElement(View, { style: styles.screenshotContainer },
                    this.state.attachmentUri && (React.createElement(Image, { source: { uri: this.state.attachmentUri }, style: styles.screenshotThumbnail })),
                    React.createElement(TouchableOpacity, { style: styles.screenshotButton, onPress: this.onScreenshotButtonPress },
                        React.createElement(Text, { style: styles.screenshotText }, !this._hasScreenshot() ? text.addScreenshotButtonLabel : text.removeScreenshotButtonLabel)))),
                notWeb() && config.enableTakeScreenshot && !this.state.attachmentUri && (React.createElement(TouchableOpacity, { style: styles.takeScreenshotButton, onPress: () => {
                        hideFeedbackButton();
                        onCancel();
                        showScreenshotButton();
                    } },
                    React.createElement(Text, { style: styles.takeScreenshotText, testID: 'sentry-feedback-take-screenshot-button' }, text.captureScreenshotButtonLabel))),
                React.createElement(TouchableOpacity, { style: styles.submitButton, onPress: this.handleFeedbackSubmit },
                    React.createElement(Text, { style: styles.submitText, testID: "sentry-feedback-submit-button" }, text.submitButtonLabel)),
                React.createElement(TouchableOpacity, { style: styles.cancelButton, onPress: onCancel },
                    React.createElement(Text, { style: styles.cancelText }, text.cancelButtonLabel)))));
    }
}
FeedbackWidget.defaultProps = defaultConfiguration;
FeedbackWidget._savedState = {
    name: '',
    email: '',
    description: '',
    filename: undefined,
    attachment: undefined,
    attachmentUri: undefined,
};
//# sourceMappingURL=FeedbackWidget.js.map