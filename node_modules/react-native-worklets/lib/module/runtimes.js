'use strict';

import { setupCallGuard } from "./callGuard.js";
import { getMemorySafeCapturableConsole, setupConsole } from "./initializers.js";
import { SHOULD_BE_USE_WEB } from "./PlatformChecker/index.js";
import { setupRunLoop } from "./runLoop/workletRuntime/index.js";
import { RuntimeKind } from "./runtimeKind.js";
import { createSerializable, makeShareableCloneOnUIRecursive } from "./serializable.js";
import { isWorkletFunction } from "./workletFunction.js";
import { registerWorkletsError, WorkletsError } from "./WorkletsError.js";
import { WorkletsModule } from "./WorkletsModule/index.js";

/**
 * Lets you create a new JS runtime which can be used to run worklets possibly
 * on different threads than JS or UI thread.
 *
 * @param config - Runtime configuration object - {@link WorkletRuntimeConfig}.
 * @returns WorkletRuntime which is a
 *   `jsi::HostObject<worklets::WorkletRuntime>` - {@link WorkletRuntime}
 * @see https://docs.swmansion.com/react-native-worklets/docs/threading/createWorkletRuntime/
 */
// @ts-expect-error Public API overload.

/**
 * @deprecated Please use the new config object signature instead:
 *   `createWorkletRuntime({ name, initializer })`
 *
 *   Lets you create a new JS runtime which can be used to run worklets possibly
 *   on different threads than JS or UI thread.
 * @param name - A name used to identify the runtime which will appear in
 *   devices list in Chrome DevTools.
 * @param initializer - An optional worklet that will be run synchronously on
 *   the same thread immediately after the runtime is created.
 * @returns WorkletRuntime which is a
 *   `jsi::HostObject<worklets::WorkletRuntime>` - {@link WorkletRuntime}
 * @see https://docs.swmansion.com/react-native-worklets/docs/threading/createWorkletRuntime/
 */

export function createWorkletRuntime(nameOrConfig, initializer) {
  const runtimeBoundCapturableConsole = getMemorySafeCapturableConsole();
  let name;
  let initializerFn;
  let useDefaultQueue = true;
  let customQueue;
  let animationQueuePollingRate;
  let enableEventLoop = true;
  if (typeof nameOrConfig === 'string') {
    name = nameOrConfig;
    initializerFn = initializer;
  } else {
    // TODO: Make anonymous name globally unique.
    name = nameOrConfig?.name ?? 'anonymous';
    initializerFn = nameOrConfig?.initializer;
    useDefaultQueue = nameOrConfig?.useDefaultQueue ?? true;
    customQueue = nameOrConfig?.customQueue;
    animationQueuePollingRate = Math.round(nameOrConfig?.animationQueuePollingRate ?? 16);
    enableEventLoop = nameOrConfig?.enableEventLoop ?? true;
  }
  if (initializerFn && !isWorkletFunction(initializerFn)) {
    throw new WorkletsError('The initializer passed to `createWorkletRuntime` is not a worklet.');
  }
  return WorkletsModule.createWorkletRuntime(name, createSerializable(() => {
    'worklet';

    setupCallGuard();
    registerWorkletsError();
    setupConsole(runtimeBoundCapturableConsole);
    if (enableEventLoop) {
      setupRunLoop(animationQueuePollingRate);
    }
    initializerFn?.();
  }), useDefaultQueue, customQueue, enableEventLoop);
}

// @ts-expect-error Check `runOnUI` overload.

/** Schedule a worklet to execute on the background queue. */
export function runOnRuntime(workletRuntime, worklet) {
  'worklet';

  if (__DEV__ && !SHOULD_BE_USE_WEB && !isWorkletFunction(worklet)) {
    throw new WorkletsError('The function passed to `runOnRuntime` is not a worklet.');
  }
  if (globalThis.__RUNTIME_KIND !== RuntimeKind.ReactNative) {
    return (...args) => globalThis._scheduleOnRuntime(workletRuntime, makeShareableCloneOnUIRecursive(() => {
      'worklet';

      worklet(...args);
    }));
  }
  return (...args) => WorkletsModule.scheduleOnRuntime(workletRuntime, createSerializable(() => {
    'worklet';

    worklet(...args);
    globalThis.__flushMicrotasks();
  }));
}

/** Configuration object for creating a worklet runtime. */
//# sourceMappingURL=runtimes.js.map