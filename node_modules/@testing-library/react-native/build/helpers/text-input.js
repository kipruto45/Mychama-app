"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTextInputValue = getTextInputValue;
exports.isEditableTextInput = isEditableTextInput;
var _nativeState = require("../native-state");
var _hostComponentNames = require("./host-component-names");
function isEditableTextInput(element) {
  return (0, _hostComponentNames.isHostTextInput)(element) && element.props.editable !== false;
}
function getTextInputValue(element) {
  if (!(0, _hostComponentNames.isHostTextInput)(element)) {
    throw new Error(`Element is not a "TextInput", but it has type "${element.type}".`);
  }
  return element.props.value ?? _nativeState.nativeState.valueForElement.get(element) ?? element.props.defaultValue ?? '';
}
//# sourceMappingURL=text-input.js.map