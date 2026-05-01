import type { ColorValue, ImageSource, ProcessedColorValue, ViewProps } from 'react-native';
import { DirectEventHandler, Float, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import { UnsafeMixed } from './codegenUtils';
export type IconType = 'image' | 'template' | 'sfSymbol';
type GenericEmptyEvent = Readonly<{}>;
type LifecycleStateChangeEvent = Readonly<{
    previousState: Int32;
    newState: Int32;
}>;
export type ItemStateAppearance = {
    tabBarItemTitleFontFamily?: string;
    tabBarItemTitleFontSize?: Float;
    tabBarItemTitleFontWeight?: string;
    tabBarItemTitleFontStyle?: string;
    tabBarItemTitleFontColor?: ProcessedColorValue | null;
    tabBarItemTitlePositionAdjustment?: {
        horizontal?: Float;
        vertical?: Float;
    };
    tabBarItemIconColor?: ProcessedColorValue | null;
    tabBarItemBadgeBackgroundColor?: ProcessedColorValue | null;
};
export type ItemAppearance = {
    normal?: ItemStateAppearance;
    selected?: ItemStateAppearance;
    focused?: ItemStateAppearance;
    disabled?: ItemStateAppearance;
};
export type Appearance = {
    stacked?: ItemAppearance;
    inline?: ItemAppearance;
    compactInline?: ItemAppearance;
    tabBarBackgroundColor?: ProcessedColorValue | null;
    tabBarShadowColor?: ProcessedColorValue | null;
    tabBarBlurEffect?: WithDefault<BlurEffect, 'systemDefault'>;
};
type BlurEffect = 'none' | 'systemDefault' | 'extraLight' | 'light' | 'dark' | 'regular' | 'prominent' | 'systemUltraThinMaterial' | 'systemThinMaterial' | 'systemMaterial' | 'systemThickMaterial' | 'systemChromeMaterial' | 'systemUltraThinMaterialLight' | 'systemThinMaterialLight' | 'systemMaterialLight' | 'systemThickMaterialLight' | 'systemChromeMaterialLight' | 'systemUltraThinMaterialDark' | 'systemThinMaterialDark' | 'systemMaterialDark' | 'systemThickMaterialDark' | 'systemChromeMaterialDark';
type Orientation = 'inherit' | 'all' | 'allButUpsideDown' | 'portrait' | 'portraitUp' | 'portraitDown' | 'landscape' | 'landscapeLeft' | 'landscapeRight';
type SystemItem = 'none' | 'bookmarks' | 'contacts' | 'downloads' | 'favorites' | 'featured' | 'history' | 'more' | 'mostRecent' | 'mostViewed' | 'recents' | 'search' | 'topRated';
export interface NativeProps extends ViewProps {
    onLifecycleStateChange?: DirectEventHandler<LifecycleStateChangeEvent>;
    onWillAppear?: DirectEventHandler<GenericEmptyEvent>;
    onDidAppear?: DirectEventHandler<GenericEmptyEvent>;
    onWillDisappear?: DirectEventHandler<GenericEmptyEvent>;
    onDidDisappear?: DirectEventHandler<GenericEmptyEvent>;
    isFocused?: boolean;
    tabKey: string;
    title?: string | undefined | null;
    badgeValue?: string;
    orientation?: WithDefault<Orientation, 'inherit'>;
    iconResourceName?: string;
    iconResource?: ImageSource;
    tabBarItemBadgeTextColor?: ColorValue;
    tabBarItemBadgeBackgroundColor?: ColorValue;
    standardAppearance?: UnsafeMixed<Appearance>;
    scrollEdgeAppearance?: UnsafeMixed<Appearance>;
    iconType?: WithDefault<IconType, 'sfSymbol'>;
    iconImageSource?: ImageSource;
    iconSfSymbolName?: string;
    selectedIconImageSource?: ImageSource;
    selectedIconSfSymbolName?: string;
    systemItem?: WithDefault<SystemItem, 'none'>;
    specialEffects?: {
        repeatedTabSelection?: {
            popToRoot?: WithDefault<boolean, true>;
            scrollToTop?: WithDefault<boolean, true>;
        };
    };
    overrideScrollViewContentInsetAdjustmentBehavior?: WithDefault<boolean, true>;
}
declare const _default: import("react-native/Libraries/Utilities/codegenNativeComponent").NativeComponentType<NativeProps>;
export default _default;
//# sourceMappingURL=BottomTabsScreenNativeComponent.d.ts.map