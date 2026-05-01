"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Wrap = exports.AnimatedWrap = void 0;
var _react = _interopRequireDefault(require("react"));
var _reanimatedWrapper = require("../reanimatedWrapper");
var _utils = require("../../../utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class Wrap extends _react.default.Component {
  render() {
    try {
      // I don't think that fighting with types over such a simple function is worth it
      // The only thing it does is add 'collapsable: false' to the child component
      // to make sure it is in the native view hierarchy so the detector can find
      // correct viewTag to attach to.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const child = _react.default.Children.only(this.props.children);
      return /*#__PURE__*/_react.default.cloneElement(child, {
        collapsable: false
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      child.props.children);
    } catch (e) {
      throw new Error((0, _utils.tagMessage)(`GestureDetector got more than one view as a child. If you want the gesture to work on multiple views, wrap them with a common parent and attach the gesture to that view.`));
    }
  }
}
exports.Wrap = Wrap;
const AnimatedWrap = exports.AnimatedWrap = _reanimatedWrapper.Reanimated?.default?.createAnimatedComponent(Wrap) ?? Wrap;
//# sourceMappingURL=Wrap.js.map