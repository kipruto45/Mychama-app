"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logger = exports._console = void 0;
var nodeConsole = _interopRequireWildcard(require("console"));
var _picocolors = _interopRequireDefault(require("picocolors"));
var _redent = _interopRequireDefault(require("redent"));
var nodeUtil = _interopRequireWildcard(require("util"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const _console = exports._console = {
  debug: nodeConsole.debug,
  info: nodeConsole.info,
  warn: nodeConsole.warn,
  error: nodeConsole.error
};
const logger = exports.logger = {
  debug(message, ...args) {
    const output = formatMessage('●', message, ...args);
    _console.debug(_picocolors.default.dim(output));
  },
  info(message, ...args) {
    const output = formatMessage('●', message, ...args);
    _console.info(output);
  },
  warn(message, ...args) {
    const output = formatMessage('▲', message, ...args);
    _console.warn(_picocolors.default.yellow(output));
  },
  error(message, ...args) {
    const output = formatMessage('■', message, ...args);
    _console.error(_picocolors.default.red(output));
  }
};
function formatMessage(symbol, message, ...args) {
  const formatted = nodeUtil.format(message, ...args);
  const indented = (0, _redent.default)(formatted, 4);
  return `  ${symbol} ${indented.trimStart()}\n`;
}
//# sourceMappingURL=logger.js.map