import type * as ReactNative from '../vendor/react-native';
export type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';
export type { EmitterSubscription } from 'react-native/Libraries/vendor/emitter/EventEmitter';
export interface ReactNativeLibrariesInterface {
    Devtools?: {
        parseErrorStack: (errorStack: string) => Array<ReactNative.StackFrame>;
        symbolicateStackTrace: (stack: Array<ReactNative.StackFrame>, extraData?: Record<string, unknown>) => Promise<ReactNative.SymbolicatedStackTrace>;
        getDevServer: () => ReactNative.DevServerInfo;
    };
    Utilities?: {
        polyfillGlobal: <T>(name: string, getValue: () => T) => void;
    };
    Promise?: typeof Promise;
    ReactNativeVersion?: ReactNative.ReactNativeVersion;
    TurboModuleRegistry?: ReactNative.TurboModuleRegistry;
    AppRegistry?: ReactNative.AppRegistry;
    ReactNative?: {
        requireNativeComponent?: <T>(viewName: string) => ReactNative.HostComponent<T>;
    };
}
//# sourceMappingURL=rnlibrariesinterface.d.ts.map