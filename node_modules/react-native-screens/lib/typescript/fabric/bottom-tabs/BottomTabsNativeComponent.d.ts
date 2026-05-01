import type { ColorValue, ViewProps } from 'react-native';
import type { DirectEventHandler, Float, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
type NativeFocusChangeEvent = {
    tabKey: string;
};
type TabBarItemLabelVisibilityMode = 'auto' | 'selected' | 'labeled' | 'unlabeled';
type TabBarMinimizeBehavior = 'automatic' | 'never' | 'onScrollDown' | 'onScrollUp';
export interface NativeProps extends ViewProps {
    onNativeFocusChange?: DirectEventHandler<NativeFocusChangeEvent>;
    tabBarBackgroundColor?: ColorValue;
    tabBarItemTitleFontFamily?: string;
    tabBarItemTitleFontSize?: Float;
    tabBarItemTitleFontSizeActive?: Float;
    tabBarItemTitleFontWeight?: string;
    tabBarItemTitleFontStyle?: string;
    tabBarItemTitleFontColor?: ColorValue;
    tabBarItemTitleFontColorActive?: ColorValue;
    tabBarItemIconColor?: ColorValue;
    tabBarItemIconColorActive?: ColorValue;
    tabBarItemActiveIndicatorColor?: ColorValue;
    tabBarItemActiveIndicatorEnabled?: WithDefault<boolean, true>;
    tabBarItemRippleColor?: ColorValue;
    tabBarItemLabelVisibilityMode?: WithDefault<TabBarItemLabelVisibilityMode, 'auto'>;
    tabBarTintColor?: ColorValue;
    tabBarMinimizeBehavior?: WithDefault<TabBarMinimizeBehavior, 'automatic'>;
    controlNavigationStateInJS?: WithDefault<boolean, false>;
}
declare const _default: import("react-native/Libraries/Utilities/codegenNativeComponent").NativeComponentType<NativeProps>;
export default _default;
//# sourceMappingURL=BottomTabsNativeComponent.d.ts.map