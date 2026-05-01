import { isPrimitive } from '../utils/is.js';
import { normalize } from '../utils/normalize.js';
import { GLOBAL_OBJ } from '../utils/worldwide.js';

/**
 * Formats the given values into a string.
 *
 * @param values - The values to format.
 * @param normalizeDepth - The depth to normalize the values.
 * @param normalizeMaxBreadth - The max breadth to normalize the values.
 * @returns The formatted string.
 */
function formatConsoleArgs(values, normalizeDepth, normalizeMaxBreadth) {
  return 'util' in GLOBAL_OBJ && typeof (GLOBAL_OBJ ).util.format === 'function'
    ? (GLOBAL_OBJ ).util.format(...values)
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
      isPrimitive(value) ? String(value) : JSON.stringify(normalize(value, normalizeDepth, normalizeMaxBreadth)),
    )
    .join(' ');
}

export { formatConsoleArgs, safeJoinConsoleArgs };
//# sourceMappingURL=utils.js.map
