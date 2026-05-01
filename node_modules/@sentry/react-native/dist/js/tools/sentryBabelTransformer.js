"use strict";
const enableLogger_1 = require("./enableLogger");
const sentryBabelTransformerUtils_1 = require("./sentryBabelTransformerUtils");
(0, enableLogger_1.enableLogger)();
const sentryBabelTransformer = (0, sentryBabelTransformerUtils_1.createSentryBabelTransformer)();
module.exports = sentryBabelTransformer;
//# sourceMappingURL=sentryBabelTransformer.js.map