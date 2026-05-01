"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Wrap = exports.AnimatedWrap = void 0;
var _react = _interopRequireWildcard(require("react"));
var _utils = require("../../../utils");
var _utils2 = require("../../../web/utils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const Wrap = exports.Wrap = /*#__PURE__*/(0, _react.forwardRef)(({
  children
}, ref) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const child = _react.default.Children.only(children);
    if ((0, _utils2.isRNSVGNode)(child)) {
      const clone = /*#__PURE__*/_react.default.cloneElement(child, {
        ref
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      child.props.children);
      return clone;
    }
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      ref: ref,
      style: {
        display: 'contents'
      },
      children: child
    });
  } catch (e) {
    throw new Error((0, _utils.tagMessage)(`GestureDetector got more than one view as a child. If you want the gesture to work on multiple views, wrap them with a common parent and attach the gesture to that view.`));
  }
});

// On web we never take a path with Reanimated,
// therefore we can simply export Wrap
const AnimatedWrap = exports.AnimatedWrap = Wrap;
//# sourceMappingURL=Wrap.web.js.map