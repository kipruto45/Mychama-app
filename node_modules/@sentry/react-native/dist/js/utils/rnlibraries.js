var _a;
/* eslint-disable @typescript-eslint/no-var-requires */
import { AppRegistry, Platform, TurboModuleRegistry } from 'react-native';
const InternalReactNativeLibrariesInterface = {
    Devtools: {
        parseErrorStack: (errorStack) => {
            const parseErrorStack = require('react-native/Libraries/Core/Devtools/parseErrorStack');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (parseErrorStack.default && typeof parseErrorStack.default === 'function') {
                // Starting with react-native 0.79, the parseErrorStack is a default export
                // https://github.com/facebook/react-native/commit/e5818d92a867dbfa5f60d176b847b1f2131cb6da
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                return parseErrorStack.default(errorStack);
            }
            // react-native 0.78 and below
            return parseErrorStack(errorStack);
        },
        symbolicateStackTrace: (stack, extraData) => {
            const symbolicateStackTrace = require('react-native/Libraries/Core/Devtools/symbolicateStackTrace');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (symbolicateStackTrace.default && typeof symbolicateStackTrace.default === 'function') {
                // Starting with react-native 0.79, the symbolicateStackTrace is a default export
                // https://github.com/facebook/react-native/commit/e5818d92a867dbfa5f60d176b847b1f2131cb6da
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                return symbolicateStackTrace.default(stack, extraData);
            }
            // react-native 0.78 and below
            return symbolicateStackTrace(stack, extraData);
        },
        getDevServer: () => {
            const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (getDevServer.default && typeof getDevServer.default === 'function') {
                // Starting with react-native 0.79, the getDevServer is a default export
                // https://github.com/facebook/react-native/commit/e5818d92a867dbfa5f60d176b847b1f2131cb6da
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                return getDevServer.default();
            }
            // react-native 0.78 and below
            return getDevServer();
        },
    },
    Promise: require('react-native/Libraries/Promise'),
    Utilities: {
        polyfillGlobal: (name, getValue) => {
            const { polyfillGlobal } = require('react-native/Libraries/Utilities/PolyfillFunctions');
            polyfillGlobal(name, getValue);
        },
    },
    ReactNativeVersion: {
        version: (_a = Platform.constants) === null || _a === void 0 ? void 0 : _a.reactNativeVersion,
    },
    TurboModuleRegistry,
    AppRegistry,
    ReactNative: {
        requireNativeComponent: (viewName) => {
            const { requireNativeComponent } = require('react-native');
            return requireNativeComponent(viewName);
        },
    },
};
export const ReactNativeLibraries = InternalReactNativeLibrariesInterface;
//# sourceMappingURL=rnlibraries.js.map