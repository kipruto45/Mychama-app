"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrapAsync = wrapAsync;
var _act = require("../act");
var _flushMicroTasks = require("../flush-micro-tasks");
/* istanbul ignore file */

/**
 * Run given async callback with temporarily disabled `act` environment and flushes microtasks queue.
 *
 * @param callback Async callback to run
 * @returns Result of the callback
 */
async function wrapAsync(callback) {
  const previousActEnvironment = (0, _act.getIsReactActEnvironment)();
  (0, _act.setReactActEnvironment)(false);
  try {
    const result = await callback();
    // Flush the microtask queue before restoring the `act` environment
    await (0, _flushMicroTasks.flushMicroTasks)();
    return result;
  } finally {
    (0, _act.setReactActEnvironment)(previousActEnvironment);
  }
}
//# sourceMappingURL=wrap-async.js.map