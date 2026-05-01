"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createNativeWrapper;
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _NativeViewGestureHandler = require("./NativeViewGestureHandler");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/*
 * This array should consist of:
 *   - All keys in propTypes from NativeGestureHandler
 *     (and all keys in GestureHandlerPropTypes)
 *   - 'onGestureHandlerEvent'
 *   - 'onGestureHandlerStateChange'
 */const NATIVE_WRAPPER_PROPS_FILTER = [..._NativeViewGestureHandler.nativeViewProps, 'onGestureHandlerEvent', 'onGestureHandlerStateChange'];
function createNativeWrapper(Component, config = {}) {
  const ComponentWrapper = /*#__PURE__*/React.forwardRef((props, ref) => {
    // Filter out props that should be passed to gesture handler wrapper
    const {
      gestureHandlerProps,
      childProps
    } = Object.keys(props).reduce((res, key) => {
      // TS being overly protective with it's types, see https://github.com/microsoft/TypeScript/issues/26255#issuecomment-458013731 for more info
      const allowedKeys = NATIVE_WRAPPER_PROPS_FILTER;
      if (allowedKeys.includes(key)) {
        // @ts-ignore FIXME(TS)
        res.gestureHandlerProps[key] = props[key];
      } else {
        // @ts-ignore FIXME(TS)
        res.childProps[key] = props[key];
      }
      return res;
    }, {
      gestureHandlerProps: {
        ...config
      },
      // Watch out not to modify config
      childProps: {
        enabled: props.enabled,
        hitSlop: props.hitSlop,
        testID: props.testID
      }
    });
    const _ref = (0, _react.useRef)(null);
    const _gestureHandlerRef = (0, _react.useRef)(null);
    (0, _react.useImperativeHandle)(ref,
    // @ts-ignore TODO(TS) decide how nulls work in this context
    () => {
      const node = _gestureHandlerRef.current;
      // Add handlerTag for relations config
      if (_ref.current && node) {
        // @ts-ignore FIXME(TS) think about createHandler return type
        _ref.current.handlerTag = node.handlerTag;
        return _ref.current;
      }
      return null;
    }, [_ref, _gestureHandlerRef]);
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_NativeViewGestureHandler.NativeViewGestureHandler, {
      ...gestureHandlerProps,
      // @ts-ignore TODO(TS)
      ref: _gestureHandlerRef,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(Component, {
        ...childProps,
        ref: _ref
      })
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ComponentWrapper.displayName = Component?.displayName ||
  // @ts-ignore if render doesn't exist it will return undefined and go further
  Component?.render?.name || typeof Component === 'string' && Component || 'ComponentWrapper';
  return ComponentWrapper;
}
//# sourceMappingURL=createNativeWrapper.js.map