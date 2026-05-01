declare global {
    function atob(encodedString: string): string;
}
/**
 * Modal is not supported in React Native < 0.71 with Fabric renderer.
 * ref: https://github.com/facebook/react-native/issues/33652
 */
export declare function isModalSupported(): boolean;
/**
 * The native driver supports color animations since React Native 0.69.
 * ref: https://github.com/facebook/react-native/commit/201f355479cafbcece3d9eb40a52bae003da3e5c
 */
export declare function isNativeDriverSupportedForColorAnimations(): boolean;
export declare const isValidEmail: (email: string) => boolean;
/**
 * Converts base64 string to Uint8Array on the web
 * @param base64 base64 string
 * @returns Uint8Array data
 */
export declare const base64ToUint8Array: (base64: string) => Uint8Array;
export declare const feedbackAlertDialog: (title: string, message: string) => void;
//# sourceMappingURL=utils.d.ts.map
