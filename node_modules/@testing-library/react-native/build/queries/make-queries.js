"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeQueries = makeQueries;
var _errors = require("../helpers/errors");
var _formatElement = require("../helpers/format-element");
var _logger = require("../helpers/logger");
var _screen = require("../screen");
var _waitFor = _interopRequireDefault(require("../wait-for"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const deprecatedKeys = ['timeout', 'interval', 'stackTraceError'];

// The WaitForOptions has been moved to the second option param of findBy* methods with the adding of TextMatchOptions
// To make the migration easier and avoid a breaking change, keep reading this options from the first param but warn
function extractDeprecatedWaitForOptions(options) {
  if (!options) {
    return undefined;
  }
  const waitForOptions = {
    timeout: options.timeout,
    interval: options.interval,
    stackTraceError: options.stackTraceError
  };
  deprecatedKeys.forEach(key => {
    const option = options[key];
    if (option) {
      _logger.logger.warn(`Use of option "${key}" in a findBy* query options (2nd parameter) is deprecated. Please pass this option in the waitForOptions (3rd parameter).
Example:

  findByText(text, {}, { ${key}: ${option.toString()} })`);
    }
  });
  return waitForOptions;
}
function formatErrorMessage(message, printElementTree) {
  if (!printElementTree) {
    return message;
  }
  if (_screen.screen.isDetached) {
    return `${message}\n\nScreen is no longer attached. Check your test for "findBy*" or "waitFor" calls that have not been awaited.\n\nWe recommend enabling "eslint-plugin-testing-library" to catch these issues at build time:\nhttps://callstack.github.io/react-native-testing-library/docs/start/quick-start#eslint-plugin`;
  }
  const json = _screen.screen.toJSON();
  if (!json) {
    return message;
  }
  return `${message}\n\n${(0, _formatElement.formatJson)(json)}`;
}
function appendElementTreeToError(error) {
  const oldMessage = error.message;
  error.message = formatErrorMessage(oldMessage, true);

  // Required to make Jest print the element tree on error
  error.stack = error.stack?.replace(oldMessage, error.message);
  return error;
}
function makeQueries(queryAllByQuery, getMissingError, getMultipleError) {
  function getAllByQuery(instance, {
    printElementTree = true
  } = {}) {
    return function getAllFn(predicate, options) {
      const results = queryAllByQuery(instance)(predicate, options);
      if (results.length === 0) {
        const errorMessage = formatErrorMessage(getMissingError(predicate, options), printElementTree);
        throw new _errors.ErrorWithStack(errorMessage, getAllFn);
      }
      return results;
    };
  }
  function queryByQuery(instance, {
    printElementTree = true
  } = {}) {
    return function singleQueryFn(predicate, options) {
      const results = queryAllByQuery(instance)(predicate, options);
      if (results.length > 1) {
        throw new _errors.ErrorWithStack(formatErrorMessage(getMultipleError(predicate, options), printElementTree), singleQueryFn);
      }
      if (results.length === 0) {
        return null;
      }
      return results[0];
    };
  }
  function getByQuery(instance, {
    printElementTree = true
  } = {}) {
    return function getFn(predicate, options) {
      const results = queryAllByQuery(instance)(predicate, options);
      if (results.length > 1) {
        throw new _errors.ErrorWithStack(getMultipleError(predicate, options), getFn);
      }
      if (results.length === 0) {
        const errorMessage = formatErrorMessage(getMissingError(predicate, options), printElementTree);
        throw new _errors.ErrorWithStack(errorMessage, getFn);
      }
      return results[0];
    };
  }
  function findAllByQuery(instance) {
    return function findAllFn(predicate, queryOptions, {
      onTimeout = error => appendElementTreeToError(error),
      ...waitForOptions
    } = {}) {
      const stackTraceError = new _errors.ErrorWithStack('STACK_TRACE_ERROR', findAllFn);
      const deprecatedWaitForOptions = extractDeprecatedWaitForOptions(queryOptions);
      return (0, _waitFor.default)(() => getAllByQuery(instance, {
        printElementTree: false
      })(predicate, queryOptions), {
        ...deprecatedWaitForOptions,
        ...waitForOptions,
        stackTraceError,
        onTimeout
      });
    };
  }
  function findByQuery(instance) {
    return function findFn(predicate, queryOptions, {
      onTimeout = error => appendElementTreeToError(error),
      ...waitForOptions
    } = {}) {
      const stackTraceError = new _errors.ErrorWithStack('STACK_TRACE_ERROR', findFn);
      const deprecatedWaitForOptions = extractDeprecatedWaitForOptions(queryOptions);
      return (0, _waitFor.default)(() => getByQuery(instance, {
        printElementTree: false
      })(predicate, queryOptions), {
        ...deprecatedWaitForOptions,
        ...waitForOptions,
        stackTraceError,
        onTimeout
      });
    };
  }
  return {
    getBy: getByQuery,
    getAllBy: getAllByQuery,
    queryBy: queryByQuery,
    queryAllBy: queryAllByQuery,
    findBy: findByQuery,
    findAllBy: findAllByQuery
  };
}
//# sourceMappingURL=make-queries.js.map