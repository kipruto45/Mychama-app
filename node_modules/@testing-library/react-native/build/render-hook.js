"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderHook = renderHook;
exports.renderHookAsync = renderHookAsync;
var React = _interopRequireWildcard(require("react"));
var _render = _interopRequireDefault(require("./render"));
var _renderAsync = _interopRequireDefault(require("./render-async"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function renderHook(hookToRender, options) {
  const result = /*#__PURE__*/React.createRef();
  function HookContainer({
    hookProps
  }) {
    const renderResult = hookToRender(hookProps);
    React.useEffect(() => {
      result.current = renderResult;
    });
    return null;
  }
  const {
    initialProps,
    ...renderOptions
  } = options ?? {};
  const {
    rerender: rerenderComponent,
    unmount
  } = (0, _render.default)(
  /*#__PURE__*/
  // @ts-expect-error since option can be undefined, initialProps can be undefined when it should'nt
  React.createElement(HookContainer, {
    hookProps: initialProps
  }), renderOptions);
  return {
    result: result,
    rerender: hookProps => rerenderComponent(/*#__PURE__*/React.createElement(HookContainer, {
      hookProps: hookProps
    })),
    unmount
  };
}
async function renderHookAsync(hookToRender, options) {
  const result = /*#__PURE__*/React.createRef();
  function TestComponent({
    hookProps
  }) {
    const renderResult = hookToRender(hookProps);
    React.useEffect(() => {
      result.current = renderResult;
    });
    return null;
  }
  const {
    initialProps,
    ...renderOptions
  } = options ?? {};
  const {
    rerenderAsync: rerenderComponentAsync,
    unmountAsync
  } = await (0, _renderAsync.default)(
  /*#__PURE__*/
  // @ts-expect-error since option can be undefined, initialProps can be undefined when it should'nt
  React.createElement(TestComponent, {
    hookProps: initialProps
  }), renderOptions);
  return {
    result: result,
    rerenderAsync: hookProps => rerenderComponentAsync(/*#__PURE__*/React.createElement(TestComponent, {
      hookProps: hookProps
    })),
    unmountAsync
  };
}
//# sourceMappingURL=render-hook.js.map