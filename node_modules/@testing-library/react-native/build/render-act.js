"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderWithAct = renderWithAct;
exports.renderWithAsyncAct = renderWithAsyncAct;
var _reactTestRenderer = _interopRequireDefault(require("react-test-renderer"));
var _act = _interopRequireDefault(require("./act"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function renderWithAct(component, options) {
  let renderer;

  // This will be called synchronously.
  void (0, _act.default)(() => {
    // @ts-expect-error `TestRenderer.create` is not typed correctly
    renderer = _reactTestRenderer.default.create(component, options);
  });

  // @ts-expect-error: `act` is synchronous, so `renderer` is already initialized here
  return renderer;
}
async function renderWithAsyncAct(component, options) {
  let renderer;

  // eslint-disable-next-line require-await
  await (0, _act.default)(async () => {
    // @ts-expect-error `TestRenderer.create` is not typed correctly
    renderer = _reactTestRenderer.default.create(component, options);
  });

  // @ts-expect-error: `renderer` is already initialized here
  return renderer;
}
//# sourceMappingURL=render-act.js.map