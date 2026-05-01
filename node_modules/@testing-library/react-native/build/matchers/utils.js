"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkHostElement = checkHostElement;
exports.formatMessage = formatMessage;
var _jestMatcherUtils = require("jest-matcher-utils");
var _redent = _interopRequireDefault(require("redent"));
var _componentTree = require("../helpers/component-tree");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class HostElementTypeError extends Error {
  constructor(received, matcherFn, context) {
    super();

    /* istanbul ignore next */
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, matcherFn);
    }
    let withType = '';
    try {
      withType = (0, _jestMatcherUtils.printWithType)('Received', received, _jestMatcherUtils.printReceived);
      /* istanbul ignore next */
    } catch {
      // Deliberately empty.
    }
    this.message = [(0, _jestMatcherUtils.matcherHint)(`${context.isNot ? '.not' : ''}.${matcherFn.name}`, 'received', ''), '', `${(0, _jestMatcherUtils.RECEIVED_COLOR)('received')} value must be a host element.`, withType].join('\n');
  }
}

/**
 * Throws HostElementTypeError if passed element is not a host element.
 *
 * @param element ReactTestInstance to check.
 * @param matcherFn Matcher function calling the check used for formatting error.
 * @param context Jest matcher context used for formatting error.
 */
function checkHostElement(element, matcherFn, context) {
  if (!(0, _componentTree.isHostElement)(element)) {
    throw new HostElementTypeError(element, matcherFn, context);
  }
}
function formatMessage(matcher, expectedLabel, expectedValue, receivedLabel, receivedValue) {
  return [`${matcher}\n`, `${expectedLabel}:\n${(0, _jestMatcherUtils.EXPECTED_COLOR)((0, _redent.default)(formatValue(expectedValue), 2))}`, `${receivedLabel}:\n${(0, _jestMatcherUtils.RECEIVED_COLOR)((0, _redent.default)(formatValue(receivedValue), 2))}`].join('\n');
}
function formatValue(value) {
  return typeof value === 'string' ? value : (0, _jestMatcherUtils.stringify)(value);
}
//# sourceMappingURL=utils.js.map