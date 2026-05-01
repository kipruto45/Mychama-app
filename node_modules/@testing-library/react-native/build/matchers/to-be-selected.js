"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toBeSelected = toBeSelected;
var _jestMatcherUtils = require("jest-matcher-utils");
var _redent = _interopRequireDefault(require("redent"));
var _accessibility = require("../helpers/accessibility");
var _formatElement = require("../helpers/format-element");
var _utils = require("./utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function toBeSelected(element) {
  (0, _utils.checkHostElement)(element, toBeSelected, this);
  return {
    pass: (0, _accessibility.computeAriaSelected)(element),
    message: () => {
      const is = this.isNot ? 'is' : 'is not';
      return [(0, _jestMatcherUtils.matcherHint)(`${this.isNot ? '.not' : ''}.toBeSelected`, 'element', ''), '', `Received element ${is} selected`, (0, _redent.default)((0, _formatElement.formatElement)(element), 2)].join('\n');
    }
  };
}
//# sourceMappingURL=to-be-selected.js.map