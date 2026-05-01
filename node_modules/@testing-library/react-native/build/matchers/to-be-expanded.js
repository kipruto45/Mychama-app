"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toBeCollapsed = toBeCollapsed;
exports.toBeExpanded = toBeExpanded;
var _jestMatcherUtils = require("jest-matcher-utils");
var _redent = _interopRequireDefault(require("redent"));
var _accessibility = require("../helpers/accessibility");
var _formatElement = require("../helpers/format-element");
var _utils = require("./utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function toBeExpanded(element) {
  (0, _utils.checkHostElement)(element, toBeExpanded, this);
  return {
    pass: (0, _accessibility.computeAriaExpanded)(element) === true,
    message: () => {
      const matcher = (0, _jestMatcherUtils.matcherHint)(`${this.isNot ? '.not' : ''}.toBeExpanded`, 'element', '');
      return [matcher, '', `Received element is ${this.isNot ? '' : 'not '}expanded:`, (0, _redent.default)((0, _formatElement.formatElement)(element), 2)].join('\n');
    }
  };
}
function toBeCollapsed(element) {
  (0, _utils.checkHostElement)(element, toBeCollapsed, this);
  return {
    pass: (0, _accessibility.computeAriaExpanded)(element) === false,
    message: () => {
      const matcher = (0, _jestMatcherUtils.matcherHint)(`${this.isNot ? '.not' : ''}.toBeCollapsed`, 'element', '');
      return [matcher, '', `Received element is ${this.isNot ? '' : 'not '}collapsed:`, (0, _redent.default)((0, _formatElement.formatElement)(element), 2)].join('\n');
    }
  };
}
//# sourceMappingURL=to-be-expanded.js.map