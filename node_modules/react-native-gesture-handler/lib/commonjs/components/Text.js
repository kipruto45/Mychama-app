"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Text = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _gestureObjects = require("../handlers/gestures/gestureObjects");
var _GestureDetector = require("../handlers/gestures/GestureDetector");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const Text = exports.Text = /*#__PURE__*/(0, _react.forwardRef)((props, ref) => {
  const {
    onPress,
    onLongPress,
    ...rest
  } = props;
  const textRef = (0, _react.useRef)(null);
  const native = _gestureObjects.GestureObjects.Native().runOnJS(true);
  const refHandler = node => {
    textRef.current = node;
    if (ref === null) {
      return;
    }
    if (typeof ref === 'function') {
      ref(node);
    } else {
      ref.current = node;
    }
  };

  // This is a special case for `Text` component. After https://github.com/software-mansion/react-native-gesture-handler/pull/3379 we check for
  // `displayName` field. However, `Text` from RN has this field set to `Text`, but is also present in `RNSVGElements` set.
  // We don't want to treat our `Text` as the one from `SVG`, therefore we add special field to ref.
  refHandler.rngh = true;
  (0, _react.useEffect)(() => {
    if (_reactNative.Platform.OS !== 'web') {
      return;
    }
    const textElement = ref ? ref.current : textRef.current;

    // At this point we are sure that textElement is div in HTML tree
    textElement?.setAttribute('rnghtext', 'true');
  }, []);
  return onPress || onLongPress ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_GestureDetector.GestureDetector, {
    gesture: native,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, {
      onPress: onPress,
      onLongPress: onLongPress,
      ref: refHandler,
      ...rest
    })
  }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, {
    ref: ref,
    ...rest
  });
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
//# sourceMappingURL=Text.js.map