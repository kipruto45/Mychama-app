import type { ThreadCpuFrame, ThreadCpuSample, ThreadId } from '@sentry/core';
import type * as Hermes from './hermes';
import type { RawThreadCpuProfile } from './types';
/**
 * Converts a Hermes profile to a Sentry profile.
 *
 * Maps Hermes samples to Sentry samples.
 * Maps Hermes stack frames to Sentry frames.
 * Hermes stack frame is an object representing a function call in the stack
 * with a link to its parent stack frame. Root of the represented stack tree
 * is main function call in Hermes that is [root] stack frame.
 *
 * @returns Sentry profile or null if no samples are found.
 */
export declare function convertToSentryProfile(hermesProfile: Hermes.Profile): RawThreadCpuProfile | null;
/**
 * Maps Hermes samples to Sentry samples.
 * Calculates the elapsed time since the first sample based on the absolute timestamps of the Hermes samples.
 * Hermes stack frame IDs represent the last (leaf, furthest from the main func) frame of the call stack.
 * @returns the mapped Sentry samples, the set of Hermes stack frame IDs, and the set of JS thread IDs
 */
export declare function mapSamples(hermesSamples: Hermes.Sample[], maxElapsedSinceStartNs?: number): {
    samples: ThreadCpuSample[];
    hermesStacks: Set<Hermes.StackFrameId>;
    jsThreads: Set<ThreadId>;
};
/**
 * Parses Hermes StackFrame to Sentry StackFrame.
 * For native frames only function name is returned, for Hermes bytecode the line and column are calculated.
 */
export declare function parseHermesJSStackFrame(frame: Hermes.StackFrame): ThreadCpuFrame;
//# sourceMappingURL=convertHermesProfile.d.ts.map