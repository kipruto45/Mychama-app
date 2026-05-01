"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstableReleaseConstantsPlugin = void 0;
const utils_1 = require("./utils");
const RELEASE_CONSTANTS_MODULE_PATH = '__sentryReleaseConstants__';
/**
 * Adds Sentry Release constants to the bundle.
 */
const unstableReleaseConstantsPlugin = (projectRoot) => ({ graph, premodules }) => {
    const notWeb = graph.transformOptions.platform !== 'web';
    if (notWeb) {
        return premodules;
    }
    const { name, version } = (0, utils_1.getExpoConfig)(projectRoot);
    if (!name || !version) {
        return premodules;
    }
    return (0, utils_1.prependModule)(premodules, createSentryReleaseModule({
        name,
        version,
    }));
};
exports.unstableReleaseConstantsPlugin = unstableReleaseConstantsPlugin;
function createSentryReleaseModule({ name, version, }) {
    return (0, utils_1.createVirtualJSModule)(RELEASE_CONSTANTS_MODULE_PATH, createReleaseConstantsSnippet({ name, version }));
}
function createReleaseConstantsSnippet({ name, version }) {
    return `var SENTRY_RELEASE;SENTRY_RELEASE={name: "${name}", version: "${version}"};`;
}
//# sourceMappingURL=sentryReleaseInjector.js.map