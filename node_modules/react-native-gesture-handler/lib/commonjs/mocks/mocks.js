"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.RectButton = exports.RawButton = exports.BorderlessButton = exports.BaseButton = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _State = require("../State");
var _Directions = require("../Directions");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const NOOP = () => {
  // Do nothing
};
const PanGestureHandler = _reactNative.View;
const attachGestureHandler = NOOP;
const createGestureHandler = NOOP;
const dropGestureHandler = NOOP;
const updateGestureHandler = NOOP;
const flushOperations = NOOP;
const install = NOOP;
const NativeViewGestureHandler = _reactNative.View;
const TapGestureHandler = _reactNative.View;
const ForceTouchGestureHandler = _reactNative.View;
const LongPressGestureHandler = _reactNative.View;
const PinchGestureHandler = _reactNative.View;
const RotationGestureHandler = _reactNative.View;
const FlingGestureHandler = _reactNative.View;
const RawButton = ({
  enabled,
  ...rest
}) => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.TouchableNativeFeedback, {
  disabled: enabled === false,
  ...rest,
  children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {})
});
exports.RawButton = RawButton;
const BaseButton = exports.BaseButton = RawButton;
const RectButton = exports.RectButton = RawButton;
const BorderlessButton = exports.BorderlessButton = _reactNative.TouchableNativeFeedback;
var _default = exports.default = {
  TouchableHighlight: _reactNative.TouchableHighlight,
  TouchableNativeFeedback: _reactNative.TouchableNativeFeedback,
  TouchableOpacity: _reactNative.TouchableOpacity,
  TouchableWithoutFeedback: _reactNative.TouchableWithoutFeedback,
  ScrollView: _reactNative.ScrollView,
  FlatList: _reactNative.FlatList,
  Switch: _reactNative.Switch,
  TextInput: _reactNative.TextInput,
  DrawerLayoutAndroid: _reactNative.DrawerLayoutAndroid,
  NativeViewGestureHandler,
  TapGestureHandler,
  ForceTouchGestureHandler,
  LongPressGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  FlingGestureHandler,
  PanGestureHandler,
  attachGestureHandler,
  createGestureHandler,
  dropGestureHandler,
  updateGestureHandler,
  flushOperations,
  install,
  // Probably can be removed
  Directions: _Directions.Directions,
  State: _State.State
};
//# sourceMappingURL=mocks.js.map