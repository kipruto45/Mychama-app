"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = findNodeHandle;
var _reactNative = require("react-native");
var _utils = require("./web/utils");
function findNodeHandle(viewRef) {
  // TODO: Remove this once we remove old API.
  if (viewRef instanceof _reactNative.FlatList) {
    // @ts-ignore This is the only way to get the scroll ref from FlatList.
    return viewRef._listRef._scrollRef.firstChild;
  }
  // Old API assumes that child handler is HTMLElement.
  // However, if we nest handlers, we will get ref to another handler.
  // In that case, we want to recursively call findNodeHandle with new handler viewTag (which can also be ref to another handler).
  if (viewRef?.viewTag !== undefined) {
    return findNodeHandle(viewRef.viewTag);
  }
  if (viewRef instanceof Element) {
    if (viewRef.style.display === 'contents') {
      return findNodeHandle(viewRef.firstChild);
    }
    return viewRef;
  }
  if ((0, _utils.isRNSVGElement)(viewRef)) {
    return viewRef.elementRef.current;
  }

  // In new API, we receive ref object which `current` field points to  wrapper `div` with `display: contents;`.
  // We want to return the first descendant (in DFS order) that doesn't have this property.
  let element = viewRef?.current;
  while (element && element.style.display === 'contents') {
    element = element.firstChild;
  }
  return element;
}
//# sourceMappingURL=findNodeHandle.web.js.map