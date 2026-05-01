"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.debug = debug;
var _formatElement = require("./format-element");
var _logger = require("./logger");
/**
 * Log pretty-printed deep test component instance
 */
function debug(instance, {
  message,
  ...formatOptions
} = {}) {
  if (message) {
    _logger.logger.info(`${message}\n\n`, (0, _formatElement.formatJson)(instance, formatOptions));
  } else {
    _logger.logger.info((0, _formatElement.formatJson)(instance, formatOptions));
  }
}
//# sourceMappingURL=debug.js.map