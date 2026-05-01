interface ReactNativeLocalize {
    getLocales: () => {
        languageCode: string;
        scriptCode?: string;
        countryCode: string;
        languageTag: string;
        isRTL: boolean;
    }[];
    getTimeZone(): string;
}
import type ReactNativeLocalize from 'react-native-localize';
export declare let OptionalReactNativeLocalize: typeof ReactNativeLocalize | undefined;
export {};
