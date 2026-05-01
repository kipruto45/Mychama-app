import type { ConfigPlugin } from 'expo/config-plugins';
import type { SentryAndroidGradlePluginOptions } from './withSentryAndroidGradlePlugin';
interface PluginProps {
    organization?: string;
    project?: string;
    authToken?: string;
    url?: string;
    experimental_android?: SentryAndroidGradlePluginOptions;
}
export declare function getSentryProperties(props: PluginProps | void): string | null;
declare const withSentry: ConfigPlugin<void | PluginProps>;
export { withSentry };
