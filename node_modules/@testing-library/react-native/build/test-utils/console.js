"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.excludeConsoleMessage = excludeConsoleMessage;
var _util = require("util");
function excludeConsoleMessage(logFn, excludeMessage) {
  return (...args) => {
    const message = (0, _util.format)(...args);
    if (message.includes(excludeMessage)) {
      return;
    }
    logFn(...args);
  };
}
//# sourceMappingURL=console.js.map