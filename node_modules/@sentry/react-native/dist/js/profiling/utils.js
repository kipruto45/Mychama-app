import { debug, forEachEnvelopeItem } from '@sentry/core';
import { getDefaultEnvironment } from '../utils/environment';
import { getDebugMetadata } from './debugid';
/**
 *
 */
export function isValidProfile(profile) {
    if (profile.samples.length <= 1) {
        if (__DEV__) {
            // Log a warning if the profile has less than 2 samples so users can know why
            // they are not seeing any profiling data and we cant avoid the back and forth
            // of asking them to provide us with a dump of the profile data.
            debug.log('[Profiling] Discarding profile because it contains less than 2 samples');
        }
        return false;
    }
    return true;
}
/**
 * Finds transactions with profile_id context in the envelope
 * @param envelope
 * @returns
 */
export function findProfiledTransactionsFromEnvelope(envelope) {
    const events = [];
    forEachEnvelopeItem(envelope, (item, type) => {
        var _a, _b, _c;
        if (type !== 'transaction') {
            return;
        }
        // First item is the type
        for (let j = 1; j < item.length; j++) {
            const event = item[j];
            // @ts-expect-error accessing private property
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if ((_c = (_b = (_a = event.contexts) === null || _a === void 0 ? void 0 : _a.trace) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.profile_id) {
                events.push(item[j]);
            }
        }
    });
    return events;
}
/**
 * Creates a profiling envelope item, if the profile does not pass validation, returns null.
 * @param event
 * @returns {ProfileEvent | null}
 */
export function enrichCombinedProfileWithEventContext(profile_id, profile, event) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    if ('js_profile' in profile) {
        return enrichAndroidProfileWithEventContext(profile_id, profile, event);
    }
    if (!profile.profile || !isValidProfile(profile.profile)) {
        return null;
    }
    const trace_id = ((_b = (_a = event.contexts) === null || _a === void 0 ? void 0 : _a.trace) === null || _b === void 0 ? void 0 : _b.trace_id) || '';
    // Log a warning if the profile has an invalid traceId (should be uuidv4).
    // All profiles and transactions are rejected if this is the case and we want to
    // warn users that this is happening if they enable debug flag
    if ((trace_id === null || trace_id === void 0 ? void 0 : trace_id.length) !== 32) {
        if (__DEV__) {
            debug.log(`[Profiling] Invalid traceId: ${trace_id} on profiled event`);
        }
    }
    return Object.assign(Object.assign({}, profile), { event_id: profile_id, runtime: {
            name: 'hermes',
            version: '', // TODO: get hermes version
        }, timestamp: event.start_timestamp ? new Date(event.start_timestamp * 1000).toISOString() : new Date().toISOString(), release: event.release || '', environment: event.environment || getDefaultEnvironment(), os: {
            name: ((_d = (_c = event.contexts) === null || _c === void 0 ? void 0 : _c.os) === null || _d === void 0 ? void 0 : _d.name) || '',
            version: ((_f = (_e = event.contexts) === null || _e === void 0 ? void 0 : _e.os) === null || _f === void 0 ? void 0 : _f.version) || '',
            build_number: ((_h = (_g = event.contexts) === null || _g === void 0 ? void 0 : _g.os) === null || _h === void 0 ? void 0 : _h.build) || '',
        }, device: {
            locale: (((_j = event.contexts) === null || _j === void 0 ? void 0 : _j.device) && event.contexts.device.locale) || '',
            model: ((_l = (_k = event.contexts) === null || _k === void 0 ? void 0 : _k.device) === null || _l === void 0 ? void 0 : _l.model) || '',
            manufacturer: ((_o = (_m = event.contexts) === null || _m === void 0 ? void 0 : _m.device) === null || _o === void 0 ? void 0 : _o.manufacturer) || '',
            architecture: ((_q = (_p = event.contexts) === null || _p === void 0 ? void 0 : _p.device) === null || _q === void 0 ? void 0 : _q.arch) || '',
            is_emulator: ((_s = (_r = event.contexts) === null || _r === void 0 ? void 0 : _r.device) === null || _s === void 0 ? void 0 : _s.simulator) || false,
        }, transaction: {
            name: event.transaction || '',
            id: event.event_id || '',
            trace_id,
            active_thread_id: ((_t = profile.transaction) === null || _t === void 0 ? void 0 : _t.active_thread_id) || '',
        }, debug_meta: {
            images: [...getDebugMetadata(), ...(((_u = profile.debug_meta) === null || _u === void 0 ? void 0 : _u.images) || [])],
        } });
}
/**
 * Creates Android profiling envelope item.
 */
export function enrichAndroidProfileWithEventContext(profile_id, profile, event) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    return Object.assign(Object.assign({}, profile), { debug_meta: {
            images: getDebugMetadata(),
        }, build_id: profile.build_id || '', device_cpu_frequencies: [], device_is_emulator: ((_b = (_a = event.contexts) === null || _a === void 0 ? void 0 : _a.device) === null || _b === void 0 ? void 0 : _b.simulator) || false, device_locale: (((_c = event.contexts) === null || _c === void 0 ? void 0 : _c.device) && event.contexts.device.locale) || '', device_manufacturer: ((_e = (_d = event.contexts) === null || _d === void 0 ? void 0 : _d.device) === null || _e === void 0 ? void 0 : _e.manufacturer) || '', device_model: ((_g = (_f = event.contexts) === null || _f === void 0 ? void 0 : _f.device) === null || _g === void 0 ? void 0 : _g.model) || '', device_os_name: ((_j = (_h = event.contexts) === null || _h === void 0 ? void 0 : _h.os) === null || _j === void 0 ? void 0 : _j.name) || '', device_os_version: ((_l = (_k = event.contexts) === null || _k === void 0 ? void 0 : _k.os) === null || _l === void 0 ? void 0 : _l.version) || '', device_physical_memory_bytes: (((_o = (_m = event.contexts) === null || _m === void 0 ? void 0 : _m.device) === null || _o === void 0 ? void 0 : _o.memory_size) && Number(event.contexts.device.memory_size).toString(10)) || '', environment: event.environment || getDefaultEnvironment(), profile_id, timestamp: event.start_timestamp ? new Date(event.start_timestamp * 1000).toISOString() : new Date().toISOString(), release: event.release || '', dist: event.dist || '', transaction_id: event.event_id || '', transaction_name: event.transaction || '', trace_id: ((_q = (_p = event.contexts) === null || _p === void 0 ? void 0 : _p.trace) === null || _q === void 0 ? void 0 : _q.trace_id) || '', version_name: event.release || '', version_code: event.dist || '' });
}
/**
 * Creates profiling event compatible carrier Object from raw Hermes profile.
 */
export function createHermesProfilingEvent(profile) {
    return {
        platform: 'javascript',
        version: '1',
        profile,
        transaction: {
            active_thread_id: profile.active_thread_id,
        },
    };
}
/**
 * Adds items to envelope if they are not already present - mutates the envelope.
 * @param envelope
 */
export function addProfilesToEnvelope(envelope, profiles) {
    if (!profiles.length) {
        return envelope;
    }
    for (const profile of profiles) {
        // @ts-expect-error untyped envelope
        envelope[1].push([{ type: 'profile' }, profile]);
    }
    return envelope;
}
//# sourceMappingURL=utils.js.map