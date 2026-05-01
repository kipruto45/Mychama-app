import React, { ReactNode } from 'react';
import { StatusBarAnimation, StyleProp, ViewStyle } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { UserSelect, ActiveCursor, MouseButton } from '../handlers/gestureHandlerCommon';
export declare enum DrawerPosition {
    LEFT = 0,
    RIGHT = 1
}
export declare enum DrawerState {
    IDLE = 0,
    DRAGGING = 1,
    SETTLING = 2
}
export declare enum DrawerType {
    FRONT = 0,
    BACK = 1,
    SLIDE = 2
}
export declare enum DrawerLockMode {
    UNLOCKED = 0,
    LOCKED_CLOSED = 1,
    LOCKED_OPEN = 2
}
export declare enum DrawerKeyboardDismissMode {
    NONE = 0,
    ON_DRAG = 1
}
export interface DrawerLayoutProps {
    /**
     * This attribute is present in the native android implementation already and is one
     * of the required params. The gesture handler version of DrawerLayout makes it
     * possible for the function passed as `renderNavigationView` to take an
     * Animated value as a parameter that indicates the progress of drawer
     * opening/closing animation (progress value is 0 when closed and 1 when
     * opened). This can be used by the drawer component to animated its children
     * while the drawer is opening or closing.
     */
    renderNavigationView: (progressAnimatedValue: SharedValue<number>) => ReactNode;
    /**
     * Determines the side from which the drawer will open.
     */
    drawerPosition?: DrawerPosition;
    /**
     * Width of the drawer.
     */
    drawerWidth?: number;
    /**
     * Background color of the drawer.
     */
    drawerBackgroundColor?: string;
    /**
     * Specifies the lock mode of the drawer.
     * Programatic opening/closing isn't affected by the lock mode. Defaults to `UNLOCKED`.
     * - `UNLOCKED` - the drawer will respond to gestures.
     * - `LOCKED_CLOSED` - the drawer will move freely until it settles in a closed position, then the gestures will be disabled.
     * - `LOCKED_OPEN` - the drawer will move freely until it settles in an opened position, then the gestures will be disabled.
     */
    drawerLockMode?: DrawerLockMode;
    /**
     * Determines if system keyboard should be closed upon dragging the drawer.
     */
    keyboardDismissMode?: DrawerKeyboardDismissMode;
    /**
     * Called when the drawer is closed.
     */
    onDrawerClose?: () => void;
    /**
     * Called when the drawer is opened.
     */
    onDrawerOpen?: () => void;
    /**
     * Called when the status of the drawer changes.
     */
    onDrawerStateChanged?: (newState: DrawerState, drawerWillShow: boolean) => void;
    /**
     * Type of animation that will play when opening the drawer.
     */
    drawerType?: DrawerType;
    /**
     * Speed of animation that will play when letting go, or dismissing the drawer.
     * This will also be the default animation speed for programatic controlls.
     */
    animationSpeed?: number;
    /**
     * Defines how far from the edge of the content view the gesture should
     * activate.
     */
    edgeWidth?: number;
    /**
     * Minimal distance to swipe before the drawer starts moving.
     */
    minSwipeDistance?: number;
    /**
     * When set to true Drawer component will use
     * {@link https://reactnative.dev/docs/statusbar StatusBar} API to hide the OS
     * status bar whenever the drawer is pulled or when its in an "open" state.
     */
    hideStatusBar?: boolean;
    /**
     * @default 'slide'
     *
     * Can be used when hideStatusBar is set to true and will select the animation
     * used for hiding/showing the status bar. See
     * {@link https://reactnative.dev/docs/statusbar StatusBar} documentation for
     * more details
     */
    statusBarAnimation?: StatusBarAnimation;
    /**
     * @default 'rgba(0, 0, 0, 0.7)'
     *
     * Color of the background overlay.
     * Animated from `0%` to `100%` as the drawer opens.
     */
    overlayColor?: string;
    /**
     * Style wrapping the content.
     */
    contentContainerStyle?: StyleProp<ViewStyle>;
    /**
     * Style wrapping the drawer.
     */
    drawerContainerStyle?: StyleProp<ViewStyle>;
    /**
     * Enables two-finger gestures on supported devices, for example iPads with
     * trackpads. If not enabled the gesture will require click + drag, with
     * `enableTrackpadTwoFingerGesture` swiping with two fingers will also trigger
     * the gesture.
     */
    enableTrackpadTwoFingerGesture?: boolean;
    onDrawerSlide?: (position: number) => void;
    /**
     * Elements that will be rendered inside the content view.
     */
    children?: ReactNode | ((openValue?: SharedValue<number>) => ReactNode);
    /**
     * @default 'none'
     * Sets whether the text inside both the drawer and the context window can be selected.
     * Values: 'none' | 'text' | 'auto'
     */
    userSelect?: UserSelect;
    /**
     * @default 'auto'
     * Sets the displayed cursor pictogram when the drawer is being dragged.
     * Values: see CSS cursor values
     */
    activeCursor?: ActiveCursor;
    /**
     * @default 'MouseButton.LEFT'
     * Allows to choose which mouse button should underlying pan handler react to.
     */
    mouseButton?: MouseButton;
    /**
     * @default 'false if MouseButton.RIGHT is specified'
     * Allows to enable/disable context menu.
     */
    enableContextMenu?: boolean;
}
export type DrawerMovementOption = {
    initialVelocity?: number;
    animationSpeed?: number;
};
export interface DrawerLayoutMethods {
    openDrawer: (options?: DrawerMovementOption) => void;
    closeDrawer: (options?: DrawerMovementOption) => void;
}
declare const DrawerLayout: React.ForwardRefExoticComponent<DrawerLayoutProps & React.RefAttributes<DrawerLayoutMethods>>;
export default DrawerLayout;
//# sourceMappingURL=ReanimatedDrawerLayout.d.ts.map