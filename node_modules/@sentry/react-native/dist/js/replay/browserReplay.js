import { replayIntegration } from '@sentry/react';
import { notWeb } from '../utils/environment';
// https://github.com/getsentry/sentry-javascript/blob/e00cb04f1bbf494067cd8475d392266ba296987a/packages/replay-internal/src/integration.ts#L109
const INTEGRATION_NAME = 'Replay';
/**
 * Browser Replay integration for React Native.
 *
 * See the [Browser Replay documentation](https://docs.sentry.io/platforms/javascript/session-replay/) for more information.
 */
const browserReplayIntegration = (options = {}) => {
    if (notWeb()) {
        // This is required because `replayIntegration` browser check doesn't
        // work for React Native.
        return browserReplayIntegrationNoop();
    }
    return replayIntegration(Object.assign(Object.assign({}, options), { mask: ['.sentry-react-native-mask', ...(options.mask || [])], unmask: ['.sentry-react-native-unmask:not(.sentry-react-native-mask *) > *', ...(options.unmask || [])] }));
};
const browserReplayIntegrationNoop = () => {
    return {
        name: INTEGRATION_NAME,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        start: () => { },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        startBuffering: () => { },
        stop: () => Promise.resolve(),
        flush: () => Promise.resolve(),
        getReplayId: () => undefined,
        getRecordingMode: () => undefined,
    };
};
export { browserReplayIntegration };
//# sourceMappingURL=browserReplay.js.map