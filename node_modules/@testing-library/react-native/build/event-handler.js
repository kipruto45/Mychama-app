"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEventHandler = getEventHandler;
exports.getEventHandlerName = getEventHandlerName;
function getEventHandler(element, eventName, options) {
  const handlerName = getEventHandlerName(eventName);
  if (typeof element.props[handlerName] === 'function') {
    return element.props[handlerName];
  }
  if (options?.loose && typeof element.props[eventName] === 'function') {
    return element.props[eventName];
  }
  if (typeof element.props[`testOnly_${handlerName}`] === 'function') {
    return element.props[`testOnly_${handlerName}`];
  }
  if (options?.loose && typeof element.props[`testOnly_${eventName}`] === 'function') {
    return element.props[`testOnly_${eventName}`];
  }
  return undefined;
}
function getEventHandlerName(eventName) {
  return `on${capitalizeFirstLetter(eventName)}`;
}
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
//# sourceMappingURL=event-handler.js.map