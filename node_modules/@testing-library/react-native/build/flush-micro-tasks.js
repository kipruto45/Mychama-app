"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flushMicroTasks = flushMicroTasks;
var _timers = require("./helpers/timers");
function flushMicroTasks() {
  return new Promise(resolve => (0, _timers.setImmediate)(resolve));
}
//# sourceMappingURL=flush-micro-tasks.js.map