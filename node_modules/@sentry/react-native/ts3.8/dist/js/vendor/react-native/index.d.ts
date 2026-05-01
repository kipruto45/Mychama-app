/// <reference types="react" />
export type StackFrame = {
    column?: number;
    file?: string;
    lineNumber?: number;
    methodName: string;
    collapse?: boolean;
};
export type CodeFrame = Readonly<{
    content: string;
    location?: {
        [key: string]: unknown;
        row: number;
        column: number;
    };
    fileName: string;
}>;
export type SymbolicatedStackTrace = Readonly<{
    stack: Array<StackFrame>;
    codeFrame?: CodeFrame;
}> | Array<StackFrame>;
export type DevServerInfo = {
    [key: string]: unknown;
    url: string;
    fullBundleUrl?: string;
    bundleLoadedFromServer: boolean;
};
type TurboModule = {
    getConstants?(): object;
};
export type TurboModuleRegistry = {
    get<T extends TurboModule>(name: string): T | null;
    getEnforcing<T extends TurboModule>(name: string): T;
};
export interface HostComponent<P> extends Pick<React.ComponentClass<P>, Exclude<keyof React.ComponentClass<P>, 'new'>> {
    new (props: P, context?: any): React.Component<P> & Readonly<unknown>;
}
export type ReactNativeVersion = {
    version: {
        major: number;
        minor: number;
        patch: number;
        prerelease?: string | null | undefined;
    };
};
export type AppRegistry = {
    runApplication: (appKey: string, appParameters: any) => void;
};
export {};
//# sourceMappingURL=index.d.ts.map
