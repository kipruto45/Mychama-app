"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GestureStateManager = void 0;
var _NodeManager = _interopRequireDefault(require("../../web/tools/NodeManager"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const GestureStateManager = exports.GestureStateManager = {
  create(handlerTag) {
    return {
      begin: () => {
        _NodeManager.default.getHandler(handlerTag).begin();
      },
      activate: () => {
        _NodeManager.default.getHandler(handlerTag).activate(true);
      },
      fail: () => {
        _NodeManager.default.getHandler(handlerTag).fail();
      },
      end: () => {
        _NodeManager.default.getHandler(handlerTag).end();
      }
    };
  }
};
//# sourceMappingURL=gestureStateManager.web.js.map