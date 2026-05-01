Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const constants = require('./constants.js');

/**
 * Check if a method path should be instrumented
 */
function shouldInstrument(methodPath) {
  return constants.ANTHROPIC_AI_INSTRUMENTED_METHODS.includes(methodPath );
}

exports.shouldInstrument = shouldInstrument;
//# sourceMappingURL=utils.js.map
