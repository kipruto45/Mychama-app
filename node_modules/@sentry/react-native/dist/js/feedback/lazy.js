import { getClient } from '@sentry/core';
import { feedbackIntegration, MOBILE_FEEDBACK_INTEGRATION_NAME } from './integration';
/**
 * Lazy loads the feedback integration if it is not already loaded.
 */
export function lazyLoadFeedbackIntegration() {
    var _a, _b;
    const integration = (_a = getClient()) === null || _a === void 0 ? void 0 : _a.getIntegrationByName(MOBILE_FEEDBACK_INTEGRATION_NAME);
    if (!integration) {
        // Lazy load the integration to track usage
        (_b = getClient()) === null || _b === void 0 ? void 0 : _b.addIntegration(feedbackIntegration());
    }
}
export const AUTO_INJECT_FEEDBACK_INTEGRATION_NAME = 'AutoInjectMobileFeedback';
/**
 * Lazy loads the auto inject feedback integration if it is not already loaded.
 */
export function lazyLoadAutoInjectFeedbackIntegration() {
    var _a, _b;
    const integration = (_a = getClient()) === null || _a === void 0 ? void 0 : _a.getIntegrationByName(AUTO_INJECT_FEEDBACK_INTEGRATION_NAME);
    if (!integration) {
        // Lazy load the integration to track usage
        (_b = getClient()) === null || _b === void 0 ? void 0 : _b.addIntegration({ name: AUTO_INJECT_FEEDBACK_INTEGRATION_NAME });
    }
}
export const AUTO_INJECT_FEEDBACK_BUTTON_INTEGRATION_NAME = 'AutoInjectMobileFeedbackButton';
/**
 * Lazy loads the auto inject feedback button integration if it is not already loaded.
 */
export function lazyLoadAutoInjectFeedbackButtonIntegration() {
    var _a, _b;
    const integration = (_a = getClient()) === null || _a === void 0 ? void 0 : _a.getIntegrationByName(AUTO_INJECT_FEEDBACK_BUTTON_INTEGRATION_NAME);
    if (!integration) {
        // Lazy load the integration to track usage
        (_b = getClient()) === null || _b === void 0 ? void 0 : _b.addIntegration({ name: AUTO_INJECT_FEEDBACK_BUTTON_INTEGRATION_NAME });
    }
}
export const AUTO_INJECT_SCREENSHOT_BUTTON_INTEGRATION_NAME = 'AutoInjectMobileScreenshotButton';
/**
 * Lazy loads the auto inject screenshot button integration if it is not already loaded.
 */
export function lazyLoadAutoInjectScreenshotButtonIntegration() {
    var _a, _b;
    const integration = (_a = getClient()) === null || _a === void 0 ? void 0 : _a.getIntegrationByName(AUTO_INJECT_SCREENSHOT_BUTTON_INTEGRATION_NAME);
    if (!integration) {
        // Lazy load the integration to track usage
        (_b = getClient()) === null || _b === void 0 ? void 0 : _b.addIntegration({ name: AUTO_INJECT_SCREENSHOT_BUTTON_INTEGRATION_NAME });
    }
}
//# sourceMappingURL=lazy.js.map