import * as React from 'react';
import { Component } from 'react';
import type { GenericTouchableProps } from './GenericTouchableProps';
import { TouchableHighlightProps as RNTouchableHighlightProps, ColorValue } from 'react-native';
interface State {
    extraChildStyle: null | {
        opacity?: number;
    };
    extraUnderlayStyle: null | {
        backgroundColor?: ColorValue;
    };
}
/**
 * @deprecated TouchableHighlight will be removed in the future version of Gesture Handler. Use Pressable instead.
 */
export type TouchableHighlightProps = RNTouchableHighlightProps & GenericTouchableProps;
/**
 * @deprecated TouchableHighlight will be removed in the future version of Gesture Handler. Use Pressable instead.
 *
 * TouchableHighlight follows RN's implementation
 */
export default class TouchableHighlight extends Component<TouchableHighlightProps, State> {
    static defaultProps: {
        activeOpacity: number;
        delayPressOut: number;
        underlayColor: string;
        delayLongPress: number;
        extraButtonProps: {
            rippleColor: string;
            exclusive: boolean;
        };
    };
    constructor(props: TouchableHighlightProps);
    showUnderlay: () => void;
    hasPressHandler: () => (((event: import("react-native").GestureResponderEvent) => void) & (() => void)) | undefined;
    hideUnderlay: () => void;
    renderChildren(): React.JSX.Element;
    onStateChange: (_from: number, to: number) => void;
    render(): React.JSX.Element;
}
export {};
//# sourceMappingURL=TouchableHighlight.d.ts.map