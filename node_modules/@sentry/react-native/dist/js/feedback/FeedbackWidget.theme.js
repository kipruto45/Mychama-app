import { Appearance } from 'react-native';
import { getColorScheme, getFeedbackDarkTheme, getFeedbackLightTheme } from './integration';
/**
 * Get the theme for the feedback widget based on the current color scheme
 */
export function getTheme() {
    const userTheme = getColorScheme();
    const colorScheme = userTheme === 'system' ? Appearance.getColorScheme() : userTheme;
    const lightTheme = Object.assign(Object.assign({}, LightTheme), getFeedbackLightTheme());
    const darkTheme = Object.assign(Object.assign({}, DarkTheme), getFeedbackDarkTheme());
    return colorScheme === 'dark' ? darkTheme : lightTheme;
}
export const LightTheme = {
    accentBackground: 'rgba(88, 74, 192, 1)',
    accentForeground: '#ffffff',
    foreground: '#2b2233',
    background: '#ffffff',
    border: 'rgba(41, 35, 47, 0.13)',
    feedbackIcon: 'rgba(54, 45, 89, 1)',
    sentryLogo: 'rgba(54, 45, 89, 1)',
};
export const DarkTheme = {
    accentBackground: 'rgba(88, 74, 192, 1)',
    accentForeground: '#ffffff',
    foreground: '#ebe6ef',
    background: '#29232f',
    border: 'rgba(235, 230, 239, 0.15)',
    feedbackIcon: '#ffffff',
    sentryLogo: '#ffffff',
};
//# sourceMappingURL=FeedbackWidget.theme.js.map