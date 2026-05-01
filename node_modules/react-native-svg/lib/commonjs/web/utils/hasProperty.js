"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasTouchableProperty = hasTouchableProperty;
function hasTouchableProperty(props) {
  return !!(props.onPress || props.onPressIn || props.onPressOut || props.onLongPress);
}
//# sourceMappingURL=hasProperty.js.map