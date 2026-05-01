import type { Span } from '@sentry/core';
export interface ReactNavigationRoute {
    name: string;
    key: string;
    params: Record<string, any>;
}
export interface ReactNavigationCurrentRoute extends ReactNavigationRoute {
    hasBeenSeen: boolean;
}
export type RouteChangeContextData = {
    previousRoute?: {
        [key: string]: unknown;
        name: string;
    } | null;
    route: {
        [key: string]: unknown;
        name: string;
        hasBeenSeen: boolean;
    };
};
export type BeforeNavigate = (context: Span) => void;
//# sourceMappingURL=types.d.ts.map