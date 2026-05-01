import type { AndroidCombinedProfileEvent, CombinedProfileEvent } from './types';
export declare const PROFILE_QUEUE: {
    get: (key: string) => AndroidCombinedProfileEvent | CombinedProfileEvent | undefined;
    add: (key: string, value: AndroidCombinedProfileEvent | CombinedProfileEvent) => void;
    delete: (key: string) => boolean;
    clear: () => void;
    size: () => number;
};
//# sourceMappingURL=cache.d.ts.map