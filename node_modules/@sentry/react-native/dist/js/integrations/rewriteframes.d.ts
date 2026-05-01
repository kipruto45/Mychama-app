import type { Integration } from '@sentry/core';
export declare const ANDROID_DEFAULT_BUNDLE_NAME = "app:///index.android.bundle";
export declare const IOS_DEFAULT_BUNDLE_NAME = "app:///main.jsbundle";
/**
 * Creates React Native default rewrite frames integration
 * which appends app:// to the beginning of the filename
 * and removes file://, 'address at' prefixes, CodePush postfix,
 * and Expo bundle postfix.
 */
export declare function createReactNativeRewriteFrames(): Integration;
//# sourceMappingURL=rewriteframes.d.ts.map