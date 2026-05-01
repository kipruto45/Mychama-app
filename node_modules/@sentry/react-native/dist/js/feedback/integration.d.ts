import { type Integration } from '@sentry/core';
import type { FeedbackWidgetTheme } from './FeedbackWidget.theme';
import type { FeedbackButtonProps, FeedbackWidgetProps, ScreenshotButtonProps } from './FeedbackWidget.types';
export declare const MOBILE_FEEDBACK_INTEGRATION_NAME = "MobileFeedback";
type FeedbackIntegration = Integration & {
    options: Partial<FeedbackWidgetProps>;
    buttonOptions: Partial<FeedbackButtonProps>;
    screenshotButtonOptions: Partial<ScreenshotButtonProps>;
    colorScheme?: 'system' | 'light' | 'dark';
    themeLight: Partial<FeedbackWidgetTheme>;
    themeDark: Partial<FeedbackWidgetTheme>;
};
export declare const feedbackIntegration: (initOptions?: Partial<FeedbackWidgetProps> & {
    buttonOptions?: FeedbackButtonProps;
    screenshotButtonOptions?: ScreenshotButtonProps;
    colorScheme?: 'system' | 'light' | 'dark';
    themeLight?: Partial<FeedbackWidgetTheme>;
    themeDark?: Partial<FeedbackWidgetTheme>;
}) => FeedbackIntegration;
export declare const getFeedbackOptions: () => Partial<FeedbackWidgetProps>;
export declare const getFeedbackButtonOptions: () => Partial<FeedbackButtonProps>;
export declare const getScreenshotButtonOptions: () => Partial<ScreenshotButtonProps>;
export declare const getColorScheme: () => 'system' | 'light' | 'dark';
export declare const getFeedbackLightTheme: () => Partial<FeedbackWidgetTheme>;
export declare const getFeedbackDarkTheme: () => Partial<FeedbackWidgetTheme>;
export {};
//# sourceMappingURL=integration.d.ts.map