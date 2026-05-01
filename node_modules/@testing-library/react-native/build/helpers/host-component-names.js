"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isHostImage = isHostImage;
exports.isHostModal = isHostModal;
exports.isHostScrollView = isHostScrollView;
exports.isHostSwitch = isHostSwitch;
exports.isHostText = isHostText;
exports.isHostTextInput = isHostTextInput;
const HOST_TEXT_NAMES = ['Text', 'RCTText'];
const HOST_TEXT_INPUT_NAMES = ['TextInput'];
const HOST_IMAGE_NAMES = ['Image'];
const HOST_SWITCH_NAMES = ['RCTSwitch'];
const HOST_SCROLL_VIEW_NAMES = ['RCTScrollView'];
const HOST_MODAL_NAMES = ['Modal'];

/**
 * Checks if the given element is a host Text element.
 * @param element The element to check.
 */
function isHostText(element) {
  return typeof element?.type === 'string' && HOST_TEXT_NAMES.includes(element.type);
}

/**
 * Checks if the given element is a host TextInput element.
 * @param element The element to check.
 */
function isHostTextInput(element) {
  return typeof element?.type === 'string' && HOST_TEXT_INPUT_NAMES.includes(element.type);
}

/**
 * Checks if the given element is a host Image element.
 * @param element The element to check.
 */
function isHostImage(element) {
  return typeof element?.type === 'string' && HOST_IMAGE_NAMES.includes(element.type);
}

/**
 * Checks if the given element is a host Switch element.
 * @param element The element to check.
 */
function isHostSwitch(element) {
  return typeof element?.type === 'string' && HOST_SWITCH_NAMES.includes(element.type);
}

/**
 * Checks if the given element is a host ScrollView element.
 * @param element The element to check.
 */
function isHostScrollView(element) {
  return typeof element?.type === 'string' && HOST_SCROLL_VIEW_NAMES.includes(element.type);
}

/**
 * Checks if the given element is a host Modal element.
 * @param element The element to check.
 */
function isHostModal(element) {
  return typeof element?.type === 'string' && HOST_MODAL_NAMES.includes(element.type);
}
//# sourceMappingURL=host-component-names.js.map