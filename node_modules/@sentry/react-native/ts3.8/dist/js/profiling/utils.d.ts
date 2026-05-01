import type { Envelope, Event, ThreadCpuProfile } from '@sentry/core';
import type { AndroidCombinedProfileEvent, AndroidProfileEvent, CombinedProfileEvent, HermesProfileEvent, ProfileEvent, RawThreadCpuProfile } from './types';
/**
 *
 */
export declare function isValidProfile(profile: ThreadCpuProfile): profile is RawThreadCpuProfile & {
    profile_id: string;
};
/**
 * Finds transactions with profile_id context in the envelope
 * @param envelope
 * @returns
 */
export declare function findProfiledTransactionsFromEnvelope(envelope: Envelope): Event[];
/**
 * Creates a profiling envelope item, if the profile does not pass validation, returns null.
 * @param event
 * @returns {ProfileEvent | null}
 */
export declare function enrichCombinedProfileWithEventContext(profile_id: string, profile: CombinedProfileEvent | AndroidCombinedProfileEvent, event: Event): ProfileEvent | null;
/**
 * Creates Android profiling envelope item.
 */
export declare function enrichAndroidProfileWithEventContext(profile_id: string, profile: AndroidCombinedProfileEvent, event: Event): AndroidProfileEvent | null;
/**
 * Creates profiling event compatible carrier Object from raw Hermes profile.
 */
export declare function createHermesProfilingEvent(profile: RawThreadCpuProfile): HermesProfileEvent;
/**
 * Adds items to envelope if they are not already present - mutates the envelope.
 * @param envelope
 */
export declare function addProfilesToEnvelope(envelope: Envelope, profiles: ProfileEvent[]): Envelope;
//# sourceMappingURL=utils.d.ts.map
