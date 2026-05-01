"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.matchAccessibilityLabel = matchAccessibilityLabel;
var _matches = require("../../matches");
var _accessibility = require("../accessibility");
function matchAccessibilityLabel(element, expectedLabel, options) {
  return (0, _matches.matches)(expectedLabel, (0, _accessibility.computeAriaLabel)(element), options?.normalizer, options?.exact);
}
//# sourceMappingURL=match-label-text.js.map