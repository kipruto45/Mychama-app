"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = render;
exports.renderInternal = renderInternal;
var React = _interopRequireWildcard(require("react"));
var _act = _interopRequireDefault(require("./act"));
var _cleanup = require("./cleanup");
var _config = require("./config");
var _componentTree = require("./helpers/component-tree");
var _debug = require("./helpers/debug");
var _stringValidation = require("./helpers/string-validation");
var _renderAct = require("./render-act");
var _screen = require("./screen");
var _within = require("./within");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * Renders test component deeply using React Test Renderer and exposes helpers
 * to assert on the output.
 */
function render(component, options = {}) {
  return renderInternal(component, options);
}
function renderInternal(component, options) {
  const {
    wrapper: Wrapper,
    concurrentRoot,
    unstable_validateStringsRenderedWithinText,
    ...rest
  } = options || {};
  const testRendererOptions = {
    ...rest,
    // @ts-expect-error incomplete typing on RTR package
    unstable_isConcurrent: concurrentRoot ?? (0, _config.getConfig)().concurrentRoot
  };
  if (unstable_validateStringsRenderedWithinText) {
    return renderWithStringValidation(component, {
      wrapper: Wrapper,
      ...testRendererOptions
    });
  }
  const wrap = element => Wrapper ? /*#__PURE__*/React.createElement(Wrapper, null, element) : element;
  const renderer = (0, _renderAct.renderWithAct)(wrap(component), testRendererOptions);
  return buildRenderResult(renderer, wrap);
}
function renderWithStringValidation(component, options = {}) {
  const {
    wrapper: Wrapper,
    ...testRendererOptions
  } = options ?? {};
  const wrap = element => /*#__PURE__*/React.createElement(React.Profiler, {
    id: "renderProfiler",
    onRender: handleRender
  }, Wrapper ? /*#__PURE__*/React.createElement(Wrapper, null, element) : element);
  const handleRender = (_, phase) => {
    if (renderer && phase === 'update') {
      (0, _stringValidation.validateStringsRenderedWithinText)(renderer.toJSON());
    }
  };
  const renderer = (0, _renderAct.renderWithAct)(wrap(component), testRendererOptions);
  (0, _stringValidation.validateStringsRenderedWithinText)(renderer.toJSON());
  return buildRenderResult(renderer, wrap);
}
function buildRenderResult(renderer, wrap) {
  const instance = renderer.root;
  const rerender = component => {
    void (0, _act.default)(() => {
      renderer.update(wrap(component));
    });
  };
  const rerenderAsync = async component => {
    // eslint-disable-next-line require-await
    await (0, _act.default)(async () => {
      renderer.update(wrap(component));
    });
  };
  const unmount = () => {
    void (0, _act.default)(() => {
      renderer.unmount();
    });
  };
  const unmountAsync = async () => {
    // eslint-disable-next-line require-await
    await (0, _act.default)(async () => {
      renderer.unmount();
    });
  };
  (0, _cleanup.addToCleanupQueue)(unmountAsync);
  const result = {
    ...(0, _within.getQueriesForElement)(instance),
    rerender,
    rerenderAsync,
    update: rerender,
    // alias for 'rerender'
    updateAsync: rerenderAsync,
    // alias for `rerenderAsync`
    unmount,
    unmountAsync,
    toJSON: renderer.toJSON,
    debug: makeDebug(renderer),
    get root() {
      return (0, _componentTree.getHostSelves)(instance)[0];
    },
    UNSAFE_root: instance
  };

  // Add as non-enumerable property, so that it's safe to enumerate
  // `render` result, e.g. using destructuring rest syntax.
  Object.defineProperty(result, 'container', {
    enumerable: false,
    get() {
      throw new Error("'container' property has been renamed to 'UNSAFE_root'.\n\n" + "Consider using 'root' property which returns root host element.");
    }
  });
  (0, _screen.setRenderResult)(result);
  return result;
}
function makeDebug(renderer) {
  function debugImpl(options) {
    const {
      defaultDebugOptions
    } = (0, _config.getConfig)();
    const debugOptions = {
      ...defaultDebugOptions,
      ...options
    };
    const json = renderer.toJSON();
    if (json) {
      return (0, _debug.debug)(json, debugOptions);
    }
  }
  return debugImpl;
}
//# sourceMappingURL=render.js.map