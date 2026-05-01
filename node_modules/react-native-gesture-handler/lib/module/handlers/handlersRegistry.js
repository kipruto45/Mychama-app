"use strict";

import { isTestEnv } from '../utils';
export const handlerIDToTag = {};
const gestures = new Map();
const oldHandlers = new Map();
const testIDs = new Map();
export function registerHandler(handlerTag, handler, testID) {
  gestures.set(handlerTag, handler);
  if (isTestEnv() && testID) {
    testIDs.set(testID, handlerTag);
  }
}
export function registerOldGestureHandler(handlerTag, handler) {
  oldHandlers.set(handlerTag, handler);
}
export function unregisterOldGestureHandler(handlerTag) {
  oldHandlers.delete(handlerTag);
}
export function unregisterHandler(handlerTag, testID) {
  gestures.delete(handlerTag);
  if (isTestEnv() && testID) {
    testIDs.delete(testID);
  }
}
export function findHandler(handlerTag) {
  return gestures.get(handlerTag);
}
export function findOldGestureHandler(handlerTag) {
  return oldHandlers.get(handlerTag);
}
export function findHandlerByTestID(testID) {
  const handlerTag = testIDs.get(testID);
  if (handlerTag !== undefined) {
    return findHandler(handlerTag) ?? null;
  }
  return null;
}
//# sourceMappingURL=handlersRegistry.js.map