Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const is = require('../utils/is.js');
const normalize = require('../utils/normalize.js');
const worldwide = require('../utils/worldwide.js');

/**
 * Formats the given values into a string.
 *
 * @param values - The values to format.
 * @param normalizeDepth - The depth to normalize the values.
 * @param normalizeMaxBreadth - The max breadth to normalize the values.
 * @returns The formatted string.
 */
function formatConsoleArgs(values, normalizeDepth, normalizeMaxBreadth) {
  return 'util' in worldwide.GLOBAL_OBJ && typeof (worldwide.GLOBAL_OBJ ).util.format === 'function'
    ? (worldwide.GLOBAL_OBJ ).util.format(...values)
    : safeJoinConsoleArgs(values, normalizeDepth, normalizeMaxBreadth);
}

/**
 * Joins the given values into a string.
 *
 * @param values - The values to join.
 * @param normalizeDepth - The depth to normalize the values.
 * @param normalizeMaxBreadth - The max breadth to normalize the values.
 * @returns The joined string.
 */
function safeJoinConsoleArgs(values, normalizeDepth, normalizeMaxBreadth) {
  return values
    .map(value =>
      is.isPrimitive(value) ? String(value) : JSON.stringify(normalize.normalize(value, normalizeDepth, normalizeMaxBreadth)),
    )
    .join(' ');
}

exports.formatConsoleArgs = formatConsoleArgs;
exports.safeJoinConsoleArgs = safeJoinConsoleArgs;
//# sourceMappingURL=utils.js.map
