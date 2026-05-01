import * as React from 'react';
/**
 * Wrapper to add Sentry Playground to your application
 * to test your Sentry React Native SDK setup.
 *
 * @example
 * ```tsx
 * import * as Sentry from '@sentry/react-native';
 * import { withSentryPlayground } from '@sentry/react-native/playground';
 *
 * function App() {
 *   return <View>...</View>;
 * }
 *
 * export default withSentryPlayground(Sentry.wrap(App), {
 *   projectId: '123456',
 *   organizationSlug: 'my-org'
 * });
 * ```
 */
export declare const withSentryPlayground: <P extends object>(Component: React.ComponentType<P>, options?: {
    projectId?: string;
    organizationSlug?: string;
}) => React.ComponentType<P>;
export declare const SentryPlayground: ({ projectId, organizationSlug, }: {
    projectId?: string | undefined;
    organizationSlug?: string | undefined;
}) => React.ReactElement;
//# sourceMappingURL=modal.d.ts.map