/**
 * Event which fires when an action is dispatched.
 * Only intended for debugging purposes, don't use it for app logic.
 * This event will be emitted before state changes have been applied.
 */
export type UnsafeAction = {
    data: {
        /**
         * The action object which was dispatched.
         */
        action: {
            readonly type: string;
            readonly payload?: object | undefined;
            readonly source?: string | undefined;
            readonly target?: string | undefined;
        };
        /**
         * Whether the action was a no-op, i.e. resulted any state changes.
         */
        noop: boolean;
        /**
         * Stack trace of the action, this will only be available during development.
         */
        stack: string | undefined;
    };
};
//# sourceMappingURL=types.d.ts.map