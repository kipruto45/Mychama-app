import type { StyleProp, ViewStyle, TouchableWithoutFeedbackProps, Insets } from 'react-native';
import type { UserSelect } from '../../handlers/gestureHandlerCommon';
import { ExtraButtonProps } from './ExtraButtonProps';
export interface GenericTouchableProps extends Omit<TouchableWithoutFeedbackProps, 'hitSlop'> {
    onPress?: () => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    onLongPress?: () => void;
    nativeID?: string;
    shouldActivateOnStart?: boolean;
    disallowInterruption?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    hitSlop?: Insets | number;
    userSelect?: UserSelect;
    extraButtonProps?: ExtraButtonProps;
}
//# sourceMappingURL=GenericTouchableProps.d.ts.map