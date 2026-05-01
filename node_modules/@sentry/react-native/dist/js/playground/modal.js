/* eslint-disable max-lines */
import { debug } from '@sentry/core';
import * as React from 'react';
import { Animated, Image, Modal, Platform, Pressable, SafeAreaView, StyleSheet, Text, useColorScheme, View, } from 'react-native';
import { getDevServer } from '../integrations/debugsymbolicatorutils';
import { isExpo, isExpoGo, isWeb } from '../utils/environment';
import { bug as bugAnimation, hi as hiAnimation, thumbsup as thumbsupAnimation } from './animations';
import { nativeCrashExample, tryCatchExample, uncaughtErrorExample } from './examples';
import { bug as bugImage, hi as hiImage, thumbsup as thumbsupImage } from './images';
/**
 * Wrapper to add Sentry Playground to your application
 * to test your Sentry React Native SDK setup.
 *
 * @example
 * ```tsx
 * import * as Sentry from '@sentry/react-native';
 * import { withSentryPlayground } from '@sentry/react-native/playground';
 *
 * function App() {
 *   return <View>...</View>;
 * }
 *
 * export default withSentryPlayground(Sentry.wrap(App), {
 *   projectId: '123456',
 *   organizationSlug: 'my-org'
 * });
 * ```
 */
export const withSentryPlayground = (Component, options = {}) => {
    const Wrapper = (props) => {
        return (React.createElement(React.Fragment, null,
            React.createElement(SentryPlayground, { projectId: options.projectId, organizationSlug: options.organizationSlug }),
            React.createElement(Component, Object.assign({}, props))));
    };
    Wrapper.displayName = 'withSentryPlayground()';
    return Wrapper;
};
export const SentryPlayground = ({ projectId, organizationSlug, }) => {
    const issuesStreamUrl = projectId && organizationSlug
        ? `https://${organizationSlug}.sentry.io/issues/?project=${projectId}&statsPeriod=1h`
        : 'https://sentry.io/';
    const styles = useColorScheme() === 'dark' ? defaultDarkStyles : lightStyles;
    const [show, setShow] = React.useState(true);
    const [animation, setAnimation] = React.useState('hi');
    const onAnimationPress = () => {
        switch (animation) {
            case 'hi':
                setAnimation('thumbsup');
                break;
            default:
                setAnimation('hi');
        }
    };
    const showOpenSentryButton = !isExpo();
    const isNativeCrashDisabled = isWeb() || isExpoGo() || __DEV__;
    const animationContainerYPosition = React.useRef(new Animated.Value(0)).current;
    const springAnimation = Animated.sequence([
        Animated.timing(animationContainerYPosition, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
        }),
        Animated.spring(animationContainerYPosition, {
            toValue: 0,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }),
    ]);
    const changeAnimationToBug = (func) => {
        setAnimation('bug');
        springAnimation.start(() => {
            func();
        });
    };
    return (React.createElement(Modal, { presentationStyle: "formSheet", visible: show, animationType: "slide", onRequestClose: () => {
            setShow(false);
        } },
        React.createElement(SafeAreaView, { style: styles.background },
            React.createElement(View, { style: styles.container },
                React.createElement(Text, { style: styles.welcomeText }, "Welcome to Sentry Playground!"),
                React.createElement(Animated.View, { style: {
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: [{ translateY: animationContainerYPosition }],
                    }, onTouchEnd: () => {
                        springAnimation.start();
                    } },
                    React.createElement(Pressable, { onPress: onAnimationPress },
                        React.createElement(Animation, { id: animation }))),
                React.createElement(View, { style: styles.listContainer },
                    React.createElement(Row, { title: 'captureException()', description: 'In a try-catch scenario, errors can be reported using manual APIs.', actionDescription: 'Try', action: tryCatchExample }),
                    React.createElement(Row, { title: 'throw new Error()', description: 'Uncaught errors are automatically reported by the React Native Global Handler.', actionDescription: 'Throw', action: () => changeAnimationToBug(uncaughtErrorExample) }),
                    React.createElement(Row, { title: 'throw RuntimeException()', description: isNativeCrashDisabled
                            ? 'For testing native crashes, build the mobile application in release mode.'
                            : 'Unhandled errors in native layers such as Java, Objective-C, C, Swift, or Kotlin are automatically reported.', actionDescription: 'Crash', action: nativeCrashExample, last: true, disabled: isNativeCrashDisabled })),
                React.createElement(View, { style: { marginTop: 40 } }),
                React.createElement(View, { style: {
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'space-evenly', // Space between buttons
                    } },
                    showOpenSentryButton && (React.createElement(Button, { secondary: true, title: 'Open Sentry', onPress: () => {
                            openURLInBrowser(issuesStreamUrl);
                        } })),
                    React.createElement(Button, { title: 'Go to my App', onPress: () => {
                            setShow(false);
                        } }))))));
};
const Animation = ({ id }) => {
    const shouldFallbackToImage = Platform.OS === 'android';
    switch (id) {
        case 'hi':
            return (React.createElement(Image, { source: { uri: shouldFallbackToImage ? hiImage : hiAnimation }, style: { width: 100, height: 100 } }));
        case 'bug':
            return (React.createElement(Image, { source: { uri: shouldFallbackToImage ? bugImage : bugAnimation }, style: { width: 100, height: 100 } }));
        case 'thumbsup':
            return (React.createElement(Image, { source: { uri: shouldFallbackToImage ? thumbsupImage : thumbsupAnimation }, style: { width: 100, height: 100 } }));
        default:
            return null;
    }
};
const Row = ({ last = false, 
// eslint-disable-next-line @typescript-eslint/no-empty-function
action = () => { }, actionDescription = '', title, description, disabled = false, }) => {
    const styles = useColorScheme() === 'dark' ? defaultDarkStyles : lightStyles;
    return (React.createElement(View, { style: [styles.rowContainer, last && styles.lastRowContainer] },
        React.createElement(View, { style: { flexShrink: 1, paddingRight: 12 } },
            React.createElement(Text, { style: styles.rowTitle }, title),
            React.createElement(Text, { style: { color: 'rgb(146, 130, 170)', fontSize: 12 } }, description)),
        React.createElement(View, null,
            React.createElement(Button, { disabled: disabled, secondary: true, onPress: action, title: actionDescription }))));
};
const Button = ({ onPress, title, secondary, disabled = false, }) => {
    const styles = useColorScheme() === 'dark' ? defaultDarkStyles : lightStyles;
    return (React.createElement(View, { style: [styles.buttonBottomLayer, styles.buttonCommon, secondary && styles.buttonSecondaryBottomLayer] },
        React.createElement(Pressable, { style: ({ pressed }) => [
                styles.buttonMainContainer,
                pressed && styles.buttonMainContainerPressed,
                styles.buttonCommon,
                secondary && styles.buttonSecondaryContainer,
                disabled && styles.buttonDisabledContainer,
            ], onPress: onPress, disabled: disabled },
            React.createElement(Text, { style: [styles.buttonText, secondary && styles.buttonSecondaryText, disabled && styles.buttonDisabledText] }, title))));
};
const defaultDarkStyles = StyleSheet.create({
    welcomeText: { color: 'rgb(246, 245, 250)', fontSize: 24, fontWeight: 'bold' },
    background: {
        flex: 1,
        backgroundColor: 'rgb(26, 20, 31)',
        width: '100%',
        minHeight: '100%',
        alignItems: 'center',
        justifyContent: 'center', // Center content vertically
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        padding: 12,
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-evenly', // Center image and button container
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 20, // Add some space above the buttons
    },
    listContainer: {
        backgroundColor: 'rgb(39, 36, 51)',
        width: '100%',
        flexDirection: 'column',
        marginTop: 20,
        borderColor: 'rgb(7, 5, 15)',
        borderWidth: 1,
        borderRadius: 8,
    },
    rowTitle: {
        color: 'rgb(246, 245, 250)',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'left',
        fontFamily: 'Menlo',
    },
    rowContainer: {
        overflow: 'hidden',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 16,
        paddingBottom: 10,
        paddingHorizontal: 10,
        borderColor: 'rgb(7, 5, 15)',
        borderBottomWidth: 1,
    },
    lastRowContainer: {
        borderBottomWidth: 0, // Remove border for the last row
    },
    buttonCommon: {
        borderRadius: 8,
    },
    buttonBottomLayer: {
        backgroundColor: 'rgb(7, 5, 15)',
    },
    buttonMainContainer: {
        paddingVertical: 8,
        paddingHorizontal: 13,
        backgroundColor: 'rgb(117, 83, 255)',
        transform: [{ translateY: -4 }],
        borderWidth: 1,
        borderColor: 'rgb(7, 5, 15)',
    },
    buttonSecondaryContainer: {
        backgroundColor: 'rgb(39, 36, 51)',
    },
    buttonSecondaryBottomLayer: {},
    buttonSecondaryText: {},
    buttonMainContainerPressed: {
        transform: [{ translateY: 0 }],
    },
    buttonText: {
        color: 'rgb(246, 245, 250)',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonDisabledText: {
        color: 'rgb(146, 130, 170)',
    },
    buttonDisabledContainer: {
        transform: [{ translateY: -2 }],
        backgroundColor: 'rgb(39, 36, 51)',
    },
});
const lightStyles = StyleSheet.create(Object.assign(Object.assign({}, defaultDarkStyles), { welcomeText: Object.assign(Object.assign({}, defaultDarkStyles.welcomeText), { color: 'rgb(24, 20, 35)' }), background: Object.assign(Object.assign({}, defaultDarkStyles.background), { backgroundColor: 'rgb(251, 250, 255)' }), buttonMainContainer: Object.assign(Object.assign({}, defaultDarkStyles.buttonMainContainer), { backgroundColor: 'rgb(117, 83, 255)', borderColor: 'rgb(85, 61, 184)' }), buttonBottomLayer: {
        backgroundColor: 'rgb(85, 61, 184)',
    }, buttonSecondaryContainer: {
        backgroundColor: 'rgb(255, 255, 255)',
        borderColor: 'rgb(218, 215, 229)',
    }, buttonSecondaryBottomLayer: {
        backgroundColor: 'rgb(218, 215, 229)',
    }, buttonText: Object.assign({}, defaultDarkStyles.buttonText), buttonSecondaryText: Object.assign(Object.assign({}, defaultDarkStyles.buttonText), { color: 'rgb(24, 20, 35)' }), rowTitle: Object.assign(Object.assign({}, defaultDarkStyles.rowTitle), { color: 'rgb(24, 20, 35)' }), rowContainer: Object.assign(Object.assign({}, defaultDarkStyles.rowContainer), { borderColor: 'rgb(218, 215, 229)' }), listContainer: Object.assign(Object.assign({}, defaultDarkStyles.listContainer), { borderColor: 'rgb(218, 215, 229)', backgroundColor: 'rgb(255, 255, 255)' }), buttonDisabledContainer: Object.assign(Object.assign({}, defaultDarkStyles.buttonDisabledContainer), { backgroundColor: 'rgb(238, 235, 249)' }) }));
function openURLInBrowser(url) {
    const devServer = getDevServer();
    if (devServer === null || devServer === void 0 ? void 0 : devServer.url) {
        // This doesn't work for Expo project with Web enabled
        // disable-next-line @typescript-eslint/no-floating-promises
        fetch(`${devServer.url}open-url`, {
            method: 'POST',
            body: JSON.stringify({ url }),
        }).catch(e => {
            debug.error('Error opening URL:', e);
        });
    }
    else {
        debug.error('Dev server URL not available');
    }
}
//# sourceMappingURL=modal.js.map