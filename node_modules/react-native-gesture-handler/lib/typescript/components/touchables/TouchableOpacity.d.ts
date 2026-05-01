import { Animated, TouchableOpacityProps as RNTouchableOpacityProps } from 'react-native';
import type { GenericTouchableProps } from './GenericTouchableProps';
import * as React from 'react';
import { Component } from 'react';
/**
 * @deprecated TouchableOpacity will be removed in the future version of Gesture Handler. Use Pressable instead.
 */
export type TouchableOpacityProps = RNTouchableOpacityProps & GenericTouchableProps & {
    useNativeAnimations?: boolean;
};
/**
 * @deprecated TouchableOpacity will be removed in the future version of Gesture Handler. Use Pressable instead.
 *
 * TouchableOpacity bases on timing animation which has been used in RN's core
 */
export default class TouchableOpacity extends Component<TouchableOpacityProps> {
    static defaultProps: {
        activeOpacity: number;
        delayLongPress: number;
        extraButtonProps: {
            rippleColor: string;
            exclusive: boolean;
        };
    };
    getChildStyleOpacityWithDefault: () => number;
    opacity: Animated.Value;
    setOpacityTo: (value: number, duration: number) => void;
    onStateChange: (_from: number, to: number) => void;
    render(): React.JSX.Element;
}
//# sourceMappingURL=TouchableOpacity.d.ts.map