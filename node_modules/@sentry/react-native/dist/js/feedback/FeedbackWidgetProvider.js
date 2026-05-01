import { debug } from '@sentry/core';
import * as React from 'react';
import { Animated, Appearance, Dimensions, Easing, Modal, PanResponder, Platform, ScrollView, View } from 'react-native';
import { notWeb } from '../utils/environment';
import { FeedbackButton } from './FeedbackButton';
import { FeedbackWidget } from './FeedbackWidget';
import { modalSheetContainer, modalWrapper, topSpacer } from './FeedbackWidget.styles';
import { getTheme } from './FeedbackWidget.theme';
import { BACKGROUND_ANIMATION_DURATION, FeedbackButtonManager, FeedbackWidgetManager, PULL_DOWN_CLOSE_THRESHOLD, ScreenshotButtonManager, SLIDE_ANIMATION_DURATION, } from './FeedbackWidgetManager';
import { getFeedbackButtonOptions, getFeedbackOptions, getScreenshotButtonOptions } from './integration';
import { ScreenshotButton } from './ScreenshotButton';
import { isModalSupported, isNativeDriverSupportedForColorAnimations } from './utils';
const useNativeDriverForColorAnimations = isNativeDriverSupportedForColorAnimations();
/**
 * FeedbackWidgetProvider is a component that wraps the feedback widget and provides
 * functionality to show and hide the widget. It also manages the visibility of the
 * feedback button and screenshot button.
 */
export class FeedbackWidgetProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isButtonVisible: false,
            isScreenshotButtonVisible: false,
            isVisible: false,
            backgroundOpacity: new Animated.Value(0),
            panY: new Animated.Value(Dimensions.get('screen').height),
            isScrollAtTop: true,
        };
        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: (_, gestureState) => {
                return notWeb() && this.state.isScrollAtTop && gestureState.dy > 0;
            },
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return notWeb() && this.state.isScrollAtTop && gestureState.dy > 0;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    this.state.panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > PULL_DOWN_CLOSE_THRESHOLD) {
                    // Close on swipe below a certain threshold
                    Animated.timing(this.state.panY, {
                        toValue: Dimensions.get('screen').height,
                        duration: SLIDE_ANIMATION_DURATION,
                        useNativeDriver: true,
                    }).start(() => {
                        this._handleClose();
                    });
                }
                else {
                    // Animate it back to the original position
                    Animated.spring(this.state.panY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        });
        this._handleScroll = (event) => {
            this.setState({ isScrollAtTop: event.nativeEvent.contentOffset.y <= 0 });
        };
        this._setVisibilityFunction = (visible) => {
            const updateState = () => {
                this.setState({ isVisible: visible });
            };
            if (!visible) {
                Animated.parallel([
                    Animated.timing(this.state.panY, {
                        toValue: Dimensions.get('screen').height,
                        duration: SLIDE_ANIMATION_DURATION,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.quad),
                    }),
                    Animated.timing(this.state.backgroundOpacity, {
                        toValue: 0,
                        duration: BACKGROUND_ANIMATION_DURATION,
                        useNativeDriver: useNativeDriverForColorAnimations,
                        easing: Easing.out(Easing.quad),
                    }),
                ]).start(() => {
                    // Change of the state unmount the component
                    // which would cancel the animation
                    updateState();
                });
            }
            else {
                updateState();
            }
        };
        this._setButtonVisibilityFunction = (visible) => {
            this.setState({ isButtonVisible: visible });
        };
        this._setScreenshotButtonVisibilityFunction = (visible) => {
            this.setState({ isScreenshotButtonVisible: visible });
        };
        this._handleClose = () => {
            FeedbackWidgetManager.hide();
        };
        FeedbackButtonManager.initialize(this._setButtonVisibilityFunction);
        ScreenshotButtonManager.initialize(this._setScreenshotButtonVisibilityFunction);
        FeedbackWidgetManager.initialize(this._setVisibilityFunction);
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
     * Clean up the theme listener.
     */
    componentWillUnmount() {
        if (this._themeListener) {
            this._themeListener.remove();
        }
    }
    /**
     * Animates the background opacity when the modal is shown.
     */
    componentDidUpdate(_prevProps, prevState) {
        if (!prevState.isVisible && this.state.isVisible) {
            Animated.parallel([
                Animated.timing(this.state.backgroundOpacity, {
                    toValue: 1,
                    duration: BACKGROUND_ANIMATION_DURATION,
                    useNativeDriver: useNativeDriverForColorAnimations,
                    easing: Easing.in(Easing.quad),
                }),
                Animated.timing(this.state.panY, {
                    toValue: 0,
                    duration: SLIDE_ANIMATION_DURATION,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.quad),
                }),
            ]).start(() => {
                debug.log('FeedbackWidgetProvider componentDidUpdate');
            });
        }
        else if (prevState.isVisible && !this.state.isVisible) {
            this.state.backgroundOpacity.setValue(0);
        }
    }
    /**
     * Renders the feedback form modal.
     */
    render() {
        if (!isModalSupported()) {
            debug.error('FeedbackWidget Modal is not supported in React Native < 0.71 with Fabric renderer.');
            return React.createElement(React.Fragment, null, this.props.children);
        }
        const theme = getTheme();
        const { isButtonVisible, isScreenshotButtonVisible, isVisible, backgroundOpacity } = this.state;
        const backgroundColor = backgroundOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.9)'],
        });
        // Wrapping the `Modal` component in a `View` component is necessary to avoid
        // issues like https://github.com/software-mansion/react-native-reanimated/issues/6035
        return (React.createElement(React.Fragment, null,
            this.props.children,
            isButtonVisible && React.createElement(FeedbackButton, Object.assign({}, getFeedbackButtonOptions())),
            isScreenshotButtonVisible && React.createElement(ScreenshotButton, Object.assign({}, getScreenshotButtonOptions())),
            isVisible && (React.createElement(Animated.View, { style: [modalWrapper, { backgroundColor }] },
                React.createElement(Modal, { visible: isVisible, transparent: true, animationType: "none", onRequestClose: this._handleClose, testID: "feedback-form-modal" },
                    React.createElement(View, { style: topSpacer }),
                    React.createElement(Animated.View, Object.assign({ style: [modalSheetContainer(theme), { transform: [{ translateY: this.state.panY }] }] }, this._panResponder.panHandlers),
                        React.createElement(ScrollView, { bounces: false, keyboardShouldPersistTaps: "handled", automaticallyAdjustKeyboardInsets: Platform.OS === 'ios', onScroll: this._handleScroll },
                            React.createElement(FeedbackWidget, Object.assign({}, getFeedbackOptions(), { onFormClose: this._handleClose, onFormSubmitted: this._handleClose })))))))));
    }
}
//# sourceMappingURL=FeedbackWidgetProvider.js.map