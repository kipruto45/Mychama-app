"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toBeBusy = toBeBusy;
var _jestMatcherUtils = require("jest-matcher-utils");
var _redent = _interopRequireDefault(require("redent"));
var _accessibility = require("../helpers/accessibility");
var _formatElement = require("../helpers/format-element");
var _utils = require("./utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function toBeBusy(element) {
  (0, _utils.checkHostElement)(element, toBeBusy, this);
  return {
    pass: (0, _accessibility.computeAriaBusy)(element),
    message: () => {
      const matcher = (0, _jestMatcherUtils.matcherHint)(`${this.isNot ? '.not' : ''}.toBeBusy`, 'element', '');
      return [matcher, '', `Received element is ${this.isNot ? '' : 'not '}busy:`, (0, _redent.default)((0, _formatElement.formatElement)(element), 2)].join('\n');
    }
  };
}
//# sourceMappingURL=to-be-busy.js.map