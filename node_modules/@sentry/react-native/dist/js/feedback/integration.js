var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { getClient } from '@sentry/core';
export const MOBILE_FEEDBACK_INTEGRATION_NAME = 'MobileFeedback';
export const feedbackIntegration = (initOptions = {}) => {
    const { buttonOptions, screenshotButtonOptions, colorScheme, themeLight: lightTheme, themeDark: darkTheme } = initOptions, widgetOptions = __rest(initOptions, ["buttonOptions", "screenshotButtonOptions", "colorScheme", "themeLight", "themeDark"]);
    return {
        name: MOBILE_FEEDBACK_INTEGRATION_NAME,
        options: widgetOptions,
        buttonOptions: buttonOptions || {},
        screenshotButtonOptions: screenshotButtonOptions || {},
        colorScheme: colorScheme || 'system',
        themeLight: lightTheme || {},
        themeDark: darkTheme || {},
    };
};
const _getClientIntegration = () => {
    var _a;
    return (_a = getClient()) === null || _a === void 0 ? void 0 : _a.getIntegrationByName(MOBILE_FEEDBACK_INTEGRATION_NAME);
};
export const getFeedbackOptions = () => {
    const integration = _getClientIntegration();
    if (!integration) {
        return {};
    }
    return integration.options;
};
export const getFeedbackButtonOptions = () => {
    const integration = _getClientIntegration();
    if (!integration) {
        return {};
    }
    return integration.buttonOptions;
};
export const getScreenshotButtonOptions = () => {
    const integration = _getClientIntegration();
    if (!integration) {
        return {};
    }
    return integration.screenshotButtonOptions;
};
export const getColorScheme = () => {
    const integration = _getClientIntegration();
    if (!(integration === null || integration === void 0 ? void 0 : integration.colorScheme)) {
        return 'system';
    }
    return integration.colorScheme;
};
export const getFeedbackLightTheme = () => {
    const integration = _getClientIntegration();
    if (!integration) {
        return {};
    }
    return integration.themeLight;
};
export const getFeedbackDarkTheme = () => {
    const integration = _getClientIntegration();
    if (!integration) {
        return {};
    }
    return integration.themeDark;
};
//# sourceMappingURL=integration.js.map