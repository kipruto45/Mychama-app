'use strict';

var reactNative = require('react-native');

// src/index.android.ts
var warnings = /* @__PURE__ */ new Set();
var isEdgeToEdgeFromLibrary = () => reactNative.TurboModuleRegistry.get("RNEdgeToEdge") != null;
var isEdgeToEdgeFromProperty = () => {
  var _a, _b;
  return ((_b = (_a = reactNative.TurboModuleRegistry.get("DeviceInfo")) == null ? void 0 : _a.getConstants) == null ? void 0 : _b.call(_a).isEdgeToEdge) === true;
};
var isEdgeToEdge = () => isEdgeToEdgeFromLibrary() || isEdgeToEdgeFromProperty();
var controlEdgeToEdgeValues = (values) => {
  if (__DEV__ && isEdgeToEdge()) {
    const entries = Object.entries(values).filter(
      ([, value]) => typeof value !== "undefined"
    );
    const stableKey = entries.join(" ");
    if (entries.length < 1 || warnings.has(stableKey)) {
      return;
    }
    warnings.add(stableKey);
    const isPlural = entries.length > 1;
    const lastIndex = entries.length - 1;
    const list = entries.reduce(
      (acc, [name], index) => index === 0 ? name : acc + (index === lastIndex ? " and " : ", ") + name,
      ""
    );
    console.warn(
      `${list} ${isPlural ? "values are" : "value is"} ignored when using react-native-edge-to-edge`
    );
  }
};

exports.controlEdgeToEdgeValues = controlEdgeToEdgeValues;
exports.isEdgeToEdge = isEdgeToEdge;
exports.isEdgeToEdgeFromLibrary = isEdgeToEdgeFromLibrary;
exports.isEdgeToEdgeFromProperty = isEdgeToEdgeFromProperty;
//# sourceMappingURL=index.android.js.map
//# sourceMappingURL=index.android.js.map