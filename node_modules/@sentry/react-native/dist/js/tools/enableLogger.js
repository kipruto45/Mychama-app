"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableLogger = void 0;
const core_1 = require("@sentry/core");
/**
 * Enables debug logger when SENTRY_LOG_LEVEL=debug.
 */
function enableLogger() {
    if (process.env.SENTRY_LOG_LEVEL === 'debug') {
        core_1.debug.enable();
    }
}
exports.enableLogger = enableLogger;
//# sourceMappingURL=enableLogger.js.map