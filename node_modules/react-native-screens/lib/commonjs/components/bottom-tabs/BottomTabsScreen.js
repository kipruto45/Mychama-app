"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactFreeze = require("react-freeze");
var _reactNative = require("react-native");
var _core = require("../../core");
var _BottomTabsScreenNativeComponent = _interopRequireDefault(require("../../fabric/bottom-tabs/BottomTabsScreenNativeComponent"));
var _flags = require("../../flags");
var _logging = require("../../private/logging");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
function BottomTabsScreen(props) {
  const componentNodeRef = _react.default.useRef(null);
  const componentNodeHandle = _react.default.useRef(-1);
  _react.default.useEffect(() => {
    if (componentNodeRef.current != null) {
      componentNodeHandle.current = (0, _reactNative.findNodeHandle)(componentNodeRef.current) ?? -1;
    } else {
      componentNodeHandle.current = -1;
    }
  }, []);
  const [nativeViewIsVisible, setNativeViewIsVisible] = _react.default.useState(false);
  const {
    onWillAppear,
    onDidAppear,
    onWillDisappear,
    onDidDisappear,
    isFocused = false,
    freezeContents,
    icon,
    iconResource,
    selectedIcon,
    standardAppearance,
    scrollEdgeAppearance,
    ...rest
  } = props;
  const shouldFreeze = shouldFreezeScreen(nativeViewIsVisible, isFocused, freezeContents);
  const onWillAppearCallback = _react.default.useCallback(event => {
    (0, _logging.bottomTabsDebugLog)(`TabsScreen [${componentNodeHandle.current}] onWillAppear received`);
    setNativeViewIsVisible(true);
    onWillAppear?.(event);
  }, [onWillAppear]);
  const onDidAppearCallback = _react.default.useCallback(event => {
    (0, _logging.bottomTabsDebugLog)(`TabsScreen [${componentNodeHandle.current}] onDidAppear received`);
    onDidAppear?.(event);
  }, [onDidAppear]);
  const onWillDisappearCallback = _react.default.useCallback(event => {
    (0, _logging.bottomTabsDebugLog)(`TabsScreen [${componentNodeHandle.current}] onWillDisappear received`);
    onWillDisappear?.(event);
  }, [onWillDisappear]);
  const onDidDisappearCallback = _react.default.useCallback(event => {
    (0, _logging.bottomTabsDebugLog)(`TabsScreen [${componentNodeHandle.current}] onDidDisappear received`);
    setNativeViewIsVisible(false);
    onDidDisappear?.(event);
  }, [onDidDisappear]);
  (0, _logging.bottomTabsDebugLog)(`TabsScreen [${componentNodeHandle.current ?? -1}] render; tabKey: ${rest.tabKey} shouldFreeze: ${shouldFreeze}, isFocused: ${isFocused} nativeViewIsVisible: ${nativeViewIsVisible}`);
  const iconProps = parseIconsToNativeProps(icon, selectedIcon);
  let parsedIconResource;
  if (iconResource) {
    parsedIconResource = _reactNative.Image.resolveAssetSource(iconResource);
    if (!parsedIconResource) {
      console.error('[RNScreens] failed to resolve an asset for bottom tab icon');
    }
  }
  return /*#__PURE__*/_react.default.createElement(_BottomTabsScreenNativeComponent.default, _extends({
    collapsable: false,
    style: styles.fillParent,
    onWillAppear: onWillAppearCallback,
    onDidAppear: onDidAppearCallback,
    onWillDisappear: onWillDisappearCallback,
    onDidDisappear: onDidDisappearCallback,
    isFocused: isFocused
    // I'm keeping undefined as a fallback if `Image.resolveAssetSource` has failed for some reason.
    // It won't render any icon, but it will prevent from crashing on the native side which is expecting
    // ReadableMap. Passing `iconResource` directly will result in crash, because `require` API is returning
    // double as a value.
    ,
    iconResource: parsedIconResource || undefined
  }, iconProps, {
    standardAppearance: mapAppearanceToNativeProp(standardAppearance),
    scrollEdgeAppearance: mapAppearanceToNativeProp(scrollEdgeAppearance)
    // @ts-ignore - This is debug only anyway
    ,
    ref: componentNodeRef
  }, rest), /*#__PURE__*/_react.default.createElement(_reactFreeze.Freeze, {
    freeze: shouldFreeze,
    placeholder: rest.placeholder
  }, rest.children));
}
function mapAppearanceToNativeProp(appearance) {
  if (!appearance) return undefined;
  const {
    stacked,
    inline,
    compactInline,
    tabBarBackgroundColor,
    tabBarShadowColor
  } = appearance;
  return {
    ...appearance,
    stacked: mapItemAppearanceToNativeProp(stacked),
    inline: mapItemAppearanceToNativeProp(inline),
    compactInline: mapItemAppearanceToNativeProp(compactInline),
    tabBarBackgroundColor: (0, _reactNative.processColor)(tabBarBackgroundColor),
    tabBarShadowColor: (0, _reactNative.processColor)(tabBarShadowColor)
  };
}
function mapItemAppearanceToNativeProp(itemAppearance) {
  if (!itemAppearance) return undefined;
  const {
    normal,
    selected,
    focused,
    disabled
  } = itemAppearance;
  return {
    ...itemAppearance,
    normal: mapItemStateAppearanceToNativeProp(normal),
    selected: mapItemStateAppearanceToNativeProp(selected),
    focused: mapItemStateAppearanceToNativeProp(focused),
    disabled: mapItemStateAppearanceToNativeProp(disabled)
  };
}
function mapItemStateAppearanceToNativeProp(itemStateAppearance) {
  if (!itemStateAppearance) return undefined;
  const {
    tabBarItemTitleFontColor,
    tabBarItemIconColor,
    tabBarItemBadgeBackgroundColor,
    tabBarItemTitleFontWeight
  } = itemStateAppearance;
  return {
    ...itemStateAppearance,
    tabBarItemTitleFontColor: (0, _reactNative.processColor)(tabBarItemTitleFontColor),
    tabBarItemIconColor: (0, _reactNative.processColor)(tabBarItemIconColor),
    tabBarItemBadgeBackgroundColor: (0, _reactNative.processColor)(tabBarItemBadgeBackgroundColor),
    tabBarItemTitleFontWeight: tabBarItemTitleFontWeight !== undefined ? String(tabBarItemTitleFontWeight) : undefined
  };
}
function shouldFreezeScreen(nativeViewVisible, screenFocused, freezeOverride) {
  if (!(0, _core.freezeEnabled)()) {
    return false;
  }
  if (freezeOverride !== undefined) {
    return freezeOverride;
  }
  if (_flags.featureFlags.experiment.controlledBottomTabs) {
    // If the tabs are JS controlled, we want to freeze only when given view is not focused && it is not currently visible
    return !nativeViewVisible && !screenFocused;
  }
  return !nativeViewVisible;
}
function parseIconToNativeProps(icon) {
  if (!icon) {
    return {};
  }
  if ('sfSymbolName' in icon) {
    // iOS-specific: SFSymbol usage
    return {
      iconType: 'sfSymbol',
      iconSfSymbolName: icon.sfSymbolName
    };
  } else if ('imageSource' in icon) {
    return {
      iconType: 'image',
      iconImageSource: icon.imageSource
    };
  } else if ('templateSource' in icon) {
    // iOS-specifig: image as a template usage
    return {
      iconType: 'template',
      iconImageSource: icon.templateSource
    };
  } else {
    // iOS-specific: SFSymbol, image as a template usage
    throw new Error('[RNScreens] Incorrect icon format. You must provide sfSymbolName, imageSource or templateSource.');
  }
}
function parseIconsToNativeProps(icon, selectedIcon) {
  const {
    iconImageSource,
    iconSfSymbolName,
    iconType
  } = parseIconToNativeProps(icon);
  const {
    iconImageSource: selectedIconImageSource,
    iconSfSymbolName: selectedIconSfSymbolName,
    iconType: selectedIconType
  } = parseIconToNativeProps(selectedIcon);
  if (iconType !== undefined && selectedIconType !== undefined && iconType !== selectedIconType) {
    throw new Error('[RNScreens] icon and selectedIcon must be same type.');
  } else if (iconType === undefined && selectedIconType !== undefined) {
    // iOS-specific: UIKit requirement
    throw new Error('[RNScreens] To use selectedIcon prop, the icon prop must also be provided.');
  }
  return {
    iconType,
    iconImageSource,
    iconSfSymbolName,
    selectedIconImageSource,
    selectedIconSfSymbolName
  };
}
var _default = exports.default = BottomTabsScreen;
const styles = _reactNative.StyleSheet.create({
  fillParent: {
    position: 'absolute',
    flex: 1,
    width: '100%',
    height: '100%'
  }
});
//# sourceMappingURL=BottomTabsScreen.js.map