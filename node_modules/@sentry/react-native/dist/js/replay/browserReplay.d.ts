import { replayIntegration } from '@sentry/react';
import type { Replay } from './replayInterface';
/**
 * ReplayConfiguration for browser replay integration.
 *
 * See the [Configuration documentation](https://docs.sentry.io/platforms/javascript/session-replay/configuration/) for more information.
 */
type ReplayConfiguration = Parameters<typeof replayIntegration>[0];
/**
 * Browser Replay integration for React Native.
 *
 * See the [Browser Replay documentation](https://docs.sentry.io/platforms/javascript/session-replay/) for more information.
 */
declare const browserReplayIntegration: (options?: ReplayConfiguration) => Replay;
export { browserReplayIntegration };
//# sourceMappingURL=browserReplay.d.ts.map