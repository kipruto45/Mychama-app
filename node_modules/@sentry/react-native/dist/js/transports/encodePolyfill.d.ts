import { RN_GLOBAL_OBJ } from '../utils/worldwide';
export declare const useEncodePolyfill: () => void;
export declare const globalEncodeFactory: (Encoder: EncoderClass) => (text: string) => Uint8Array;
type EncoderClass = Required<typeof RN_GLOBAL_OBJ>['TextEncoder'];
export declare const encodePolyfill: (text: string) => Uint8Array;
export {};
//# sourceMappingURL=encodePolyfill.d.ts.map