import { getCurrentScope } from '../../currentScopes.js';
import { captureException } from '../../exports.js';
import { SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN } from '../../semanticAttributes.js';
import { SPAN_STATUS_ERROR } from '../../tracing/spanstatus.js';
import { startSpanManual, startSpan } from '../../tracing/trace.js';
import { GEN_AI_OPERATION_NAME_ATTRIBUTE, GEN_AI_REQUEST_AVAILABLE_TOOLS_ATTRIBUTE, GEN_AI_REQUEST_MODEL_ATTRIBUTE, GEN_AI_REQUEST_TEMPERATURE_ATTRIBUTE, GEN_AI_REQUEST_TOP_P_ATTRIBUTE, GEN_AI_REQUEST_STREAM_ATTRIBUTE, GEN_AI_REQUEST_TOP_K_ATTRIBUTE, GEN_AI_REQUEST_FREQUENCY_PENALTY_ATTRIBUTE, GEN_AI_REQUEST_MAX_TOKENS_ATTRIBUTE, GEN_AI_REQUEST_MESSAGES_ATTRIBUTE, GEN_AI_PROMPT_ATTRIBUTE, GEN_AI_SYSTEM_ATTRIBUTE, GEN_AI_RESPONSE_TEXT_ATTRIBUTE, GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE, GEN_AI_RESPONSE_MODEL_ATTRIBUTE, GEN_AI_RESPONSE_ID_ATTRIBUTE, ANTHROPIC_AI_RESPONSE_TIMESTAMP_ATTRIBUTE } from '../ai/gen-ai-attributes.js';
import { getFinalOperationName, getSpanOperation, setTokenUsageAttributes, buildMethodPath } from '../ai/utils.js';
import { ANTHROPIC_AI_INTEGRATION_NAME } from './constants.js';
import { instrumentStream } from './streaming.js';
import { shouldInstrument } from './utils.js';

/**
 * Extract request attributes from method arguments
 */
function extractRequestAttributes(args, methodPath) {
  const attributes = {
    [GEN_AI_SYSTEM_ATTRIBUTE]: 'anthropic',
    [GEN_AI_OPERATION_NAME_ATTRIBUTE]: getFinalOperationName(methodPath),
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: 'auto.ai.anthropic',
  };

  if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
    const params = args[0] ;
    if (params.tools && Array.isArray(params.tools)) {
      attributes[GEN_AI_REQUEST_AVAILABLE_TOOLS_ATTRIBUTE] = JSON.stringify(params.tools);
    }

    attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] = params.model ?? 'unknown';
    if ('temperature' in params) attributes[GEN_AI_REQUEST_TEMPERATURE_ATTRIBUTE] = params.temperature;
    if ('top_p' in params) attributes[GEN_AI_REQUEST_TOP_P_ATTRIBUTE] = params.top_p;
    if ('stream' in params) attributes[GEN_AI_REQUEST_STREAM_ATTRIBUTE] = params.stream;
    if ('top_k' in params) attributes[GEN_AI_REQUEST_TOP_K_ATTRIBUTE] = params.top_k;
    if ('frequency_penalty' in params)
      attributes[GEN_AI_REQUEST_FREQUENCY_PENALTY_ATTRIBUTE] = params.frequency_penalty;
    if ('max_tokens' in params) attributes[GEN_AI_REQUEST_MAX_TOKENS_ATTRIBUTE] = params.max_tokens;
  } else {
    if (methodPath === 'models.retrieve' || methodPath === 'models.get') {
      // models.retrieve(model-id) and models.get(model-id)
      attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] = args[0];
    } else {
      attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] = 'unknown';
    }
  }

  return attributes;
}

/**
 * Add private request attributes to spans.
 * This is only recorded if recordInputs is true.
 */
function addPrivateRequestAttributes(span, params) {
  if ('messages' in params) {
    span.setAttributes({ [GEN_AI_REQUEST_MESSAGES_ATTRIBUTE]: JSON.stringify(params.messages) });
  }
  if ('input' in params) {
    span.setAttributes({ [GEN_AI_REQUEST_MESSAGES_ATTRIBUTE]: JSON.stringify(params.input) });
  }
  if ('prompt' in params) {
    span.setAttributes({ [GEN_AI_PROMPT_ATTRIBUTE]: JSON.stringify(params.prompt) });
  }
}

/**
 * Capture error information from the response
 * @see https://docs.anthropic.com/en/api/errors#error-shapes
 */
function handleResponseError(span, response) {
  if (response.error) {
    span.setStatus({ code: SPAN_STATUS_ERROR, message: response.error.type || 'unknown_error' });

    captureException(response.error, {
      mechanism: {
        handled: false,
        type: 'auto.ai.anthropic.anthropic_error',
      },
    });
  }
}

/**
 * Add content attributes when recordOutputs is enabled
 */
function addContentAttributes(span, response) {
  // Messages.create
  if ('content' in response) {
    if (Array.isArray(response.content)) {
      span.setAttributes({
        [GEN_AI_RESPONSE_TEXT_ATTRIBUTE]: response.content
          .map((item) => item.text)
          .filter(text => !!text)
          .join(''),
      });

      const toolCalls = [];

      for (const item of response.content) {
        if (item.type === 'tool_use' || item.type === 'server_tool_use') {
          toolCalls.push(item);
        }
      }
      if (toolCalls.length > 0) {
        span.setAttributes({ [GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE]: JSON.stringify(toolCalls) });
      }
    }
  }
  // Completions.create
  if ('completion' in response) {
    span.setAttributes({ [GEN_AI_RESPONSE_TEXT_ATTRIBUTE]: response.completion });
  }
  // Models.countTokens
  if ('input_tokens' in response) {
    span.setAttributes({ [GEN_AI_RESPONSE_TEXT_ATTRIBUTE]: JSON.stringify(response.input_tokens) });
  }
}

/**
 * Add basic metadata attributes from the response
 */
function addMetadataAttributes(span, response) {
  if ('id' in response && 'model' in response) {
    span.setAttributes({
      [GEN_AI_RESPONSE_ID_ATTRIBUTE]: response.id,
      [GEN_AI_RESPONSE_MODEL_ATTRIBUTE]: response.model,
    });

    if ('created' in response && typeof response.created === 'number') {
      span.setAttributes({
        [ANTHROPIC_AI_RESPONSE_TIMESTAMP_ATTRIBUTE]: new Date(response.created * 1000).toISOString(),
      });
    }
    if ('created_at' in response && typeof response.created_at === 'number') {
      span.setAttributes({
        [ANTHROPIC_AI_RESPONSE_TIMESTAMP_ATTRIBUTE]: new Date(response.created_at * 1000).toISOString(),
      });
    }

    if ('usage' in response && response.usage) {
      setTokenUsageAttributes(
        span,
        response.usage.input_tokens,
        response.usage.output_tokens,
        response.usage.cache_creation_input_tokens,
        response.usage.cache_read_input_tokens,
      );
    }
  }
}

/**
 * Add response attributes to spans
 */
function addResponseAttributes(span, response, recordOutputs) {
  if (!response || typeof response !== 'object') return;

  // capture error, do not add attributes if error (they shouldn't exist)
  if ('type' in response && response.type === 'error') {
    handleResponseError(span, response);
    return;
  }

  // Private response attributes that are only recorded if recordOutputs is true.
  if (recordOutputs) {
    addContentAttributes(span, response);
  }

  // Add basic metadata attributes
  addMetadataAttributes(span, response);
}

/**
 * Get record options from the integration
 */
function getRecordingOptionsFromIntegration() {
  const scope = getCurrentScope();
  const client = scope.getClient();
  const integration = client?.getIntegrationByName(ANTHROPIC_AI_INTEGRATION_NAME) ;
  const shouldRecordInputsAndOutputs = integration ? Boolean(client?.getOptions().sendDefaultPii) : false;

  return {
    recordInputs: integration?.options?.recordInputs ?? shouldRecordInputsAndOutputs,
    recordOutputs: integration?.options?.recordOutputs ?? shouldRecordInputsAndOutputs,
  };
}

/**
 * Instrument a method with Sentry spans
 * Following Sentry AI Agents Manual Instrumentation conventions
 * @see https://docs.sentry.io/platforms/javascript/guides/node/tracing/instrumentation/ai-agents-module/#manual-instrumentation
 */
function instrumentMethod(
  originalMethod,
  methodPath,
  context,
  options,
) {
  return async function instrumentedMethod(...args) {
    const finalOptions = options || getRecordingOptionsFromIntegration();
    const requestAttributes = extractRequestAttributes(args, methodPath);
    const model = requestAttributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] ?? 'unknown';
    const operationName = getFinalOperationName(methodPath);

    const params = typeof args[0] === 'object' ? (args[0] ) : undefined;
    const isStreamRequested = Boolean(params?.stream);
    const isStreamingMethod = methodPath === 'messages.stream';

    if (isStreamRequested || isStreamingMethod) {
      return startSpanManual(
        {
          name: `${operationName} ${model} stream-response`,
          op: getSpanOperation(methodPath),
          attributes: requestAttributes ,
        },
        async (span) => {
          try {
            if (finalOptions.recordInputs && params) {
              addPrivateRequestAttributes(span, params);
            }

            const result = await originalMethod.apply(context, args);
            return instrumentStream(
              result ,
              span,
              finalOptions.recordOutputs ?? false,
            ) ;
          } catch (error) {
            span.setStatus({ code: SPAN_STATUS_ERROR, message: 'internal_error' });
            captureException(error, {
              mechanism: {
                handled: false,
                type: 'auto.ai.anthropic',
                data: {
                  function: methodPath,
                },
              },
            });
            span.end();
            throw error;
          }
        },
      );
    }

    return startSpan(
      {
        name: `${operationName} ${model}`,
        op: getSpanOperation(methodPath),
        attributes: requestAttributes ,
      },
      async (span) => {
        try {
          if (finalOptions.recordInputs && args[0] && typeof args[0] === 'object') {
            addPrivateRequestAttributes(span, args[0] );
          }

          const result = await originalMethod.apply(context, args);
          addResponseAttributes(span, result, finalOptions.recordOutputs);
          return result;
        } catch (error) {
          captureException(error, {
            mechanism: {
              handled: false,
              type: 'auto.ai.anthropic',
              data: {
                function: methodPath,
              },
            },
          });
          throw error;
        }
      },
    );
  };
}

/**
 * Create a deep proxy for Anthropic AI client instrumentation
 */
function createDeepProxy(target, currentPath = '', options) {
  return new Proxy(target, {
    get(obj, prop) {
      const value = (obj )[prop];
      const methodPath = buildMethodPath(currentPath, String(prop));

      if (typeof value === 'function' && shouldInstrument(methodPath)) {
        return instrumentMethod(value , methodPath, obj, options);
      }

      if (typeof value === 'function') {
        // Bind non-instrumented functions to preserve the original `this` context,
        return value.bind(obj);
      }

      if (value && typeof value === 'object') {
        return createDeepProxy(value , methodPath, options);
      }

      return value;
    },
  }) ;
}

/**
 * Instrument an Anthropic AI client with Sentry tracing
 * Can be used across Node.js, Cloudflare Workers, and Vercel Edge
 *
 * @template T - The type of the client that extends object
 * @param client - The Anthropic AI client to instrument
 * @param options - Optional configuration for recording inputs and outputs
 * @returns The instrumented client with the same type as the input
 */
function instrumentAnthropicAiClient(client, options) {
  return createDeepProxy(client, '', options);
}

export { instrumentAnthropicAiClient };
//# sourceMappingURL=index.js.map
