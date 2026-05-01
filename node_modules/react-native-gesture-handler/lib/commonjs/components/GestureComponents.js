"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TextInput = exports.Switch = exports.ScrollView = exports.RefreshControl = exports.FlatList = exports.DrawerLayoutAndroid = void 0;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _createNativeWrapper = _interopRequireDefault(require("../handlers/createNativeWrapper"));
var _NativeViewGestureHandler = require("../handlers/NativeViewGestureHandler");
var _utils = require("../utils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const RefreshControl = exports.RefreshControl = (0, _createNativeWrapper.default)(_reactNative.RefreshControl, {
  disallowInterruption: true,
  shouldCancelWhenOutside: false
});
// eslint-disable-next-line @typescript-eslint/no-redeclare

const GHScrollView = (0, _createNativeWrapper.default)(_reactNative.ScrollView, {
  disallowInterruption: true,
  shouldCancelWhenOutside: false
});
const ScrollView = exports.ScrollView = /*#__PURE__*/React.forwardRef((props, ref) => {
  const refreshControlGestureRef = React.useRef(null);
  const {
    refreshControl,
    waitFor,
    ...rest
  } = props;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(GHScrollView, {
    ...rest,
    // @ts-ignore `ref` exists on `GHScrollView`
    ref: ref,
    waitFor: [...(0, _utils.toArray)(waitFor ?? []), refreshControlGestureRef]
    // @ts-ignore we don't pass `refreshing` prop as we only want to override the ref
    ,
    refreshControl: refreshControl ? /*#__PURE__*/React.cloneElement(refreshControl, {
      // @ts-ignore for reasons unknown to me, `ref` doesn't exist on the type inferred by TS
      ref: refreshControlGestureRef
    }) : undefined
  });
});
// Backward type compatibility with https://github.com/software-mansion/react-native-gesture-handler/blob/db78d3ca7d48e8ba57482d3fe9b0a15aa79d9932/react-native-gesture-handler.d.ts#L440-L457
// include methods of wrapped components by creating an intersection type with the RN component instead of duplicating them.
// eslint-disable-next-line @typescript-eslint/no-redeclare

const Switch = exports.Switch = (0, _createNativeWrapper.default)(_reactNative.Switch, {
  shouldCancelWhenOutside: false,
  shouldActivateOnStart: true,
  disallowInterruption: true
});
// eslint-disable-next-line @typescript-eslint/no-redeclare

const TextInput = exports.TextInput = (0, _createNativeWrapper.default)(_reactNative.TextInput);
// eslint-disable-next-line @typescript-eslint/no-redeclare

const DrawerLayoutAndroid = exports.DrawerLayoutAndroid = (0, _createNativeWrapper.default)(_reactNative.DrawerLayoutAndroid, {
  disallowInterruption: true
});
// eslint-disable-next-line @typescript-eslint/no-redeclare

const FlatList = exports.FlatList = /*#__PURE__*/React.forwardRef((props, ref) => {
  const refreshControlGestureRef = React.useRef(null);
  const {
    waitFor,
    refreshControl,
    ...rest
  } = props;
  const flatListProps = {};
  const scrollViewProps = {};
  for (const [propName, value] of Object.entries(rest)) {
    // https://github.com/microsoft/TypeScript/issues/26255
    if (_NativeViewGestureHandler.nativeViewProps.includes(propName)) {
      // @ts-ignore - this function cannot have generic type so we have to ignore this error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      scrollViewProps[propName] = value;
    } else {
      // @ts-ignore - this function cannot have generic type so we have to ignore this error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      flatListProps[propName] = value;
    }
  }
  return (
    /*#__PURE__*/
    // @ts-ignore - this function cannot have generic type so we have to ignore this error
    (0, _jsxRuntime.jsx)(_reactNative.FlatList, {
      ref: ref,
      ...flatListProps,
      renderScrollComponent: scrollProps => /*#__PURE__*/(0, _jsxRuntime.jsx)(ScrollView, {
        ...scrollProps,
        ...scrollViewProps,
        waitFor: [...(0, _utils.toArray)(waitFor ?? []), refreshControlGestureRef]
      })
      // @ts-ignore we don't pass `refreshing` prop as we only want to override the ref
      ,
      refreshControl: refreshControl ? /*#__PURE__*/React.cloneElement(refreshControl, {
        // @ts-ignore for reasons unknown to me, `ref` doesn't exist on the type inferred by TS
        ref: refreshControlGestureRef
      }) : undefined
    })
  );
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
//# sourceMappingURL=GestureComponents.js.map