/**
 * Get the theme for the feedback widget based on the current color scheme
 */
export declare function getTheme(): FeedbackWidgetTheme;
export interface FeedbackWidgetTheme {
    /**
     * Background color for surfaces
     */
    background: string;
    /**
     * Foreground color (i.e. text color)
     */
    foreground: string;
    /**
     * Foreground color for accented elements
     */
    accentForeground?: string;
    /**
     * Background color for accented elements
     */
    accentBackground?: string;
    /**
     * Border color
     */
    border?: string;
    /**
     * Color for feedback icon
     */
    feedbackIcon?: string;
    /**
     * Color for Sentry logo
     */
    sentryLogo?: string;
}
export declare const LightTheme: FeedbackWidgetTheme;
export declare const DarkTheme: FeedbackWidgetTheme;
//# sourceMappingURL=FeedbackWidget.theme.d.ts.map