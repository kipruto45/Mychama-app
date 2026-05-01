"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "act", {
  enumerable: true,
  get: function () {
    return _act.default;
  }
});
Object.defineProperty(exports, "cleanup", {
  enumerable: true,
  get: function () {
    return _cleanup.default;
  }
});
Object.defineProperty(exports, "cleanupAsync", {
  enumerable: true,
  get: function () {
    return _cleanup.cleanupAsync;
  }
});
Object.defineProperty(exports, "configure", {
  enumerable: true,
  get: function () {
    return _config.configure;
  }
});
Object.defineProperty(exports, "fireEvent", {
  enumerable: true,
  get: function () {
    return _fireEvent.default;
  }
});
Object.defineProperty(exports, "fireEventAsync", {
  enumerable: true,
  get: function () {
    return _fireEvent.fireEventAsync;
  }
});
Object.defineProperty(exports, "getDefaultNormalizer", {
  enumerable: true,
  get: function () {
    return _matches.getDefaultNormalizer;
  }
});
Object.defineProperty(exports, "getQueriesForElement", {
  enumerable: true,
  get: function () {
    return _within.getQueriesForElement;
  }
});
Object.defineProperty(exports, "isHiddenFromAccessibility", {
  enumerable: true,
  get: function () {
    return _accessibility.isHiddenFromAccessibility;
  }
});
Object.defineProperty(exports, "isInaccessible", {
  enumerable: true,
  get: function () {
    return _accessibility.isInaccessible;
  }
});
Object.defineProperty(exports, "render", {
  enumerable: true,
  get: function () {
    return _render.default;
  }
});
Object.defineProperty(exports, "renderAsync", {
  enumerable: true,
  get: function () {
    return _renderAsync.default;
  }
});
Object.defineProperty(exports, "renderHook", {
  enumerable: true,
  get: function () {
    return _renderHook.renderHook;
  }
});
Object.defineProperty(exports, "renderHookAsync", {
  enumerable: true,
  get: function () {
    return _renderHook.renderHookAsync;
  }
});
Object.defineProperty(exports, "resetToDefaults", {
  enumerable: true,
  get: function () {
    return _config.resetToDefaults;
  }
});
Object.defineProperty(exports, "screen", {
  enumerable: true,
  get: function () {
    return _screen.screen;
  }
});
Object.defineProperty(exports, "userEvent", {
  enumerable: true,
  get: function () {
    return _userEvent.userEvent;
  }
});
Object.defineProperty(exports, "waitFor", {
  enumerable: true,
  get: function () {
    return _waitFor.default;
  }
});
Object.defineProperty(exports, "waitForElementToBeRemoved", {
  enumerable: true,
  get: function () {
    return _waitForElementToBeRemoved.default;
  }
});
Object.defineProperty(exports, "within", {
  enumerable: true,
  get: function () {
    return _within.within;
  }
});
var _act = _interopRequireDefault(require("./act"));
var _cleanup = _interopRequireWildcard(require("./cleanup"));
var _fireEvent = _interopRequireWildcard(require("./fire-event"));
var _render = _interopRequireDefault(require("./render"));
var _renderAsync = _interopRequireDefault(require("./render-async"));
var _waitFor = _interopRequireDefault(require("./wait-for"));
var _waitForElementToBeRemoved = _interopRequireDefault(require("./wait-for-element-to-be-removed"));
var _within = require("./within");
var _config = require("./config");
var _accessibility = require("./helpers/accessibility");
var _matches = require("./matches");
var _renderHook = require("./render-hook");
var _screen = require("./screen");
var _userEvent = require("./user-event");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
//# sourceMappingURL=pure.js.map