import { debug, getActiveSpan, getClient, spanIsSampled, uuid4 } from '@sentry/core';
import { Platform } from 'react-native';
import { isHermesEnabled } from '../utils/environment';
import { isRootSpan } from '../utils/span';
import { NATIVE } from '../wrapper';
import { PROFILE_QUEUE } from './cache';
import { MAX_PROFILE_DURATION_MS } from './constants';
import { convertToSentryProfile } from './convertHermesProfile';
import { addProfilesToEnvelope, createHermesProfilingEvent, enrichCombinedProfileWithEventContext, findProfiledTransactionsFromEnvelope, } from './utils';
const INTEGRATION_NAME = 'HermesProfiling';
const MS_TO_NS = 1e6;
const defaultOptions = {
    platformProfilers: true,
};
/**
 * Profiling integration creates a profile for each transaction and adds it to the event envelope.
 *
 * @experimental
 */
export const hermesProfilingIntegration = (initOptions = defaultOptions) => {
    var _a;
    const usePlatformProfilers = (_a = initOptions.platformProfilers) !== null && _a !== void 0 ? _a : true;
    let _currentProfile;
    let _currentProfileTimeout;
    let isReady = false;
    const setupOnce = () => {
        if (isReady) {
            return;
        }
        isReady = true;
        if (!isHermesEnabled()) {
            debug.log('[Profiling] Hermes is not enabled, not adding profiling integration.');
            return;
        }
        const client = getClient();
        if (!client || typeof client.on !== 'function') {
            return;
        }
        _startCurrentProfileForActiveTransaction();
        client.on('spanStart', _startCurrentProfile);
        client.on('spanEnd', _finishCurrentProfileForSpan);
        client.on('beforeEnvelope', (envelope) => {
            if (!PROFILE_QUEUE.size()) {
                return;
            }
            const profiledTransactions = findProfiledTransactionsFromEnvelope(envelope);
            if (!profiledTransactions.length) {
                debug.log('[Profiling] no profiled transactions found in envelope');
                return;
            }
            const profilesToAddToEnvelope = [];
            for (const profiledTransaction of profiledTransactions) {
                const profile = _createProfileEventFor(profiledTransaction);
                if (profile) {
                    profilesToAddToEnvelope.push(profile);
                }
            }
            addProfilesToEnvelope(envelope, profilesToAddToEnvelope);
        });
    };
    const _startCurrentProfileForActiveTransaction = () => {
        if (_currentProfile) {
            return;
        }
        const activeSpan = getActiveSpan();
        activeSpan && _startCurrentProfile(activeSpan);
    };
    const _startCurrentProfile = (activeSpan) => {
        if (!isRootSpan(activeSpan)) {
            return;
        }
        _finishCurrentProfile();
        const shouldStartProfiling = _shouldStartProfiling(activeSpan);
        if (!shouldStartProfiling) {
            return;
        }
        _currentProfileTimeout = setTimeout(_finishCurrentProfile, MAX_PROFILE_DURATION_MS);
        _startNewProfile(activeSpan);
    };
    const _shouldStartProfiling = (activeSpan) => {
        var _a;
        if (!spanIsSampled(activeSpan)) {
            debug.log('[Profiling] Transaction is not sampled, skipping profiling');
            return false;
        }
        const client = getClient();
        const options = (_a = client === null || client === void 0 ? void 0 : client.getOptions) === null || _a === void 0 ? void 0 : _a.call(client);
        const profilesSampleRate = options && typeof options.profilesSampleRate === 'number' ? options.profilesSampleRate : undefined;
        if (profilesSampleRate === undefined) {
            debug.log('[Profiling] Profiling disabled, enable it by setting `profilesSampleRate` option to SDK init call.');
            return false;
        }
        // Check if we should sample this profile
        if (Math.random() > profilesSampleRate) {
            debug.log('[Profiling] Skip profiling transaction due to sampling.');
            return false;
        }
        return true;
    };
    /**
     * Starts a new profile and links it to the transaction.
     */
    const _startNewProfile = (activeSpan) => {
        const profileStartTimestampNs = startProfiling(usePlatformProfilers);
        if (!profileStartTimestampNs) {
            return;
        }
        _currentProfile = {
            span_id: activeSpan.spanContext().spanId,
            profile_id: uuid4(),
            startTimestampNs: profileStartTimestampNs,
        };
        activeSpan.setAttribute('profile_id', _currentProfile.profile_id);
        debug.log('[Profiling] started profiling: ', _currentProfile.profile_id);
    };
    /**
     * Stops current profile if the ending span is the currently profiled span.
     */
    const _finishCurrentProfileForSpan = (span) => {
        if (!isRootSpan(span)) {
            return;
        }
        if (span.spanContext().spanId !== (_currentProfile === null || _currentProfile === void 0 ? void 0 : _currentProfile.span_id)) {
            debug.log(`[Profiling] Span (${span.spanContext().spanId}) ended is not the currently profiled span (${_currentProfile === null || _currentProfile === void 0 ? void 0 : _currentProfile.span_id}). Not stopping profiling.`);
            return;
        }
        _finishCurrentProfile();
    };
    /**
     * Stops profiling and adds the profile to the queue to be processed on beforeEnvelope.
     */
    const _finishCurrentProfile = () => {
        _clearCurrentProfileTimeout();
        if (_currentProfile === undefined) {
            return;
        }
        const profile = stopProfiling(_currentProfile.startTimestampNs);
        if (!profile) {
            debug.warn('[Profiling] Stop failed. Cleaning up...');
            _currentProfile = undefined;
            return;
        }
        PROFILE_QUEUE.add(_currentProfile.profile_id, profile);
        debug.log('[Profiling] finished profiling: ', _currentProfile.profile_id);
        _currentProfile = undefined;
    };
    const _createProfileEventFor = (profiledTransaction) => {
        var _a, _b, _c, _d, _e, _f;
        const profile_id = (_c = (_b = (_a = profiledTransaction === null || profiledTransaction === void 0 ? void 0 : profiledTransaction.contexts) === null || _a === void 0 ? void 0 : _a.trace) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.profile_id;
        if (typeof profile_id !== 'string') {
            debug.log('[Profiling] cannot find profile for a transaction without a profile context');
            return null;
        }
        // Remove the profile from the transaction context before sending, relay will take care of the rest.
        if ((_f = (_e = (_d = profiledTransaction === null || profiledTransaction === void 0 ? void 0 : profiledTransaction.contexts) === null || _d === void 0 ? void 0 : _d.trace) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.profile_id) {
            delete profiledTransaction.contexts.trace.data.profile_id;
        }
        const profile = PROFILE_QUEUE.get(profile_id);
        PROFILE_QUEUE.delete(profile_id);
        if (!profile) {
            debug.log(`[Profiling] cannot find profile ${profile_id} for transaction ${profiledTransaction.event_id}`);
            return null;
        }
        const profileWithEvent = enrichCombinedProfileWithEventContext(profile_id, profile, profiledTransaction);
        debug.log(`[Profiling] Created profile ${profile_id} for transaction ${profiledTransaction.event_id}`);
        return profileWithEvent;
    };
    const _clearCurrentProfileTimeout = () => {
        _currentProfileTimeout !== undefined && clearTimeout(_currentProfileTimeout);
        _currentProfileTimeout = undefined;
    };
    return {
        name: INTEGRATION_NAME,
        setupOnce,
    };
};
/**
 * Starts Profilers and returns the timestamp when profiling started in nanoseconds.
 */
export function startProfiling(platformProfilers) {
    const started = NATIVE.startProfiling(platformProfilers);
    if (!started) {
        return null;
    }
    return Date.now() * MS_TO_NS;
}
/**
 * Stops Profilers and returns collected combined profile.
 */
export function stopProfiling(profileStartTimestampNs) {
    const collectedProfiles = NATIVE.stopProfiling();
    if (!collectedProfiles) {
        return null;
    }
    const profileEndTimestampNs = Date.now() * MS_TO_NS;
    const hermesProfile = convertToSentryProfile(collectedProfiles.hermesProfile);
    if (!hermesProfile) {
        return null;
    }
    const hermesProfileEvent = createHermesProfilingEvent(hermesProfile);
    if (!hermesProfileEvent) {
        return null;
    }
    if (collectedProfiles.androidProfile) {
        const durationNs = profileEndTimestampNs - profileStartTimestampNs;
        return createAndroidWithHermesProfile(hermesProfileEvent, collectedProfiles.androidProfile, durationNs);
    }
    else if (collectedProfiles.nativeProfile) {
        return addNativeProfileToHermesProfile(hermesProfileEvent, collectedProfiles.nativeProfile);
    }
    return hermesProfileEvent;
}
/**
 * Creates Android profile event with attached javascript profile.
 */
export function createAndroidWithHermesProfile(hermes, nativeAndroid, durationNs) {
    return Object.assign(Object.assign({}, nativeAndroid), { platform: 'android', js_profile: hermes.profile, duration_ns: durationNs.toString(10), active_thread_id: hermes.transaction.active_thread_id });
}
/**
 * Merges Hermes and Native profile events into one.
 */
export function addNativeProfileToHermesProfile(hermes, native) {
    var _a;
    return Object.assign(Object.assign(Object.assign(Object.assign({}, hermes), { profile: addNativeThreadCpuProfileToHermes(hermes.profile, native.profile, hermes.transaction.active_thread_id) }), (((_a = native.debug_meta) === null || _a === void 0 ? void 0 : _a.images) ? { debug_meta: { images: native.debug_meta.images } } : {})), { measurements: native.measurements });
}
/**
 * Merges Hermes And Native profiles into one.
 */
export function addNativeThreadCpuProfileToHermes(hermes, native, hermes_active_thread_id) {
    // assumes thread ids are unique
    hermes.thread_metadata = Object.assign(Object.assign({}, native.thread_metadata), hermes.thread_metadata);
    // assumes queue ids are unique
    hermes.queue_metadata = Object.assign(Object.assign({}, native.queue_metadata), hermes.queue_metadata);
    // recalculate frames and stacks using offset
    const framesOffset = hermes.frames.length;
    const stacksOffset = hermes.stacks.length;
    if (native.frames) {
        for (const frame of native.frames) {
            hermes.frames.push({
                function: frame.function,
                instruction_addr: frame.instruction_addr,
                platform: Platform.OS === 'ios' ? 'cocoa' : undefined,
            });
        }
    }
    hermes.stacks = [
        ...(hermes.stacks || []),
        ...(native.stacks || []).map(stack => stack.map(frameId => frameId + framesOffset)),
    ];
    hermes.samples = [
        ...(hermes.samples || []),
        ...(native.samples || [])
            .filter(sample => sample.thread_id !== hermes_active_thread_id)
            .map(sample => (Object.assign(Object.assign({}, sample), { stack_id: stacksOffset + sample.stack_id }))),
    ];
    return hermes;
}
//# sourceMappingURL=integration.js.map