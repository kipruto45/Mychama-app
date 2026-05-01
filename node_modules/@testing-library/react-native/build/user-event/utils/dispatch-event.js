"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dispatchEvent = dispatchEvent;
var _act = _interopRequireDefault(require("../../act"));
var _eventHandler = require("../../event-handler");
var _componentTree = require("../../helpers/component-tree");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Basic dispatch event function used by User Event module.
 *
 * @param element element trigger event on
 * @param eventName name of the event
 * @param event event payload(s)
 */
async function dispatchEvent(element, eventName, ...event) {
  if (!(0, _componentTree.isElementMounted)(element)) {
    return;
  }
  const handler = (0, _eventHandler.getEventHandler)(element, eventName);
  if (!handler) {
    return;
  }

  // eslint-disable-next-line require-await
  await (0, _act.default)(async () => {
    handler(...event);
  });
}
//# sourceMappingURL=dispatch-event.js.map