import type { ConfigPlugin } from 'expo/config-plugins';
type BuildPhase = {
    shellScript: string;
};
export declare const withSentryIOS: ConfigPlugin<string>;
export declare function modifyExistingXcodeBuildScript(script: BuildPhase): void;
export declare function addSentryWithBundledScriptsToBundleShellScript(script: string): string;
export {};
