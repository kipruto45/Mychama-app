import { Platform } from 'react-native';
import { ANDROID_DEFAULT_BUNDLE_NAME, IOS_DEFAULT_BUNDLE_NAME } from '../integrations/rewriteframes';
export const DEFAULT_BUNDLE_NAME = Platform.OS === 'android' ? ANDROID_DEFAULT_BUNDLE_NAME : Platform.OS === 'ios' ? IOS_DEFAULT_BUNDLE_NAME : undefined;
//# sourceMappingURL=hermes.js.map