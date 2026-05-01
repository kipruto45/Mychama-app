import { ANTHROPIC_AI_INSTRUMENTED_METHODS } from './constants.js';

/**
 * Check if a method path should be instrumented
 */
function shouldInstrument(methodPath) {
  return ANTHROPIC_AI_INSTRUMENTED_METHODS.includes(methodPath );
}

export { shouldInstrument };
//# sourceMappingURL=utils.js.map
