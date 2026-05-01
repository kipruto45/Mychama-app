"use strict";

import * as React from 'react';
import { Platform, UIManager, DeviceEventEmitter } from 'react-native';
import { customDirectEventTypes } from './customDirectEventTypes';
import RNGestureHandlerModule from '../RNGestureHandlerModule';
import { State } from '../State';
import { handlerIDToTag, registerOldGestureHandler, unregisterOldGestureHandler } from './handlersRegistry';
import { getNextHandlerTag } from './getNextHandlerTag';
import { filterConfig, scheduleFlushOperations } from './utils';
import findNodeHandle from '../findNodeHandle';
import { deepEqual, isFabric, isReact19, isTestEnv, tagMessage } from '../utils';
import { ActionType } from '../ActionType';
import { PressabilityDebugView } from './PressabilityDebugView';
import GestureHandlerRootViewContext from '../GestureHandlerRootViewContext';
import { ghQueueMicrotask } from '../ghQueueMicrotask';
import { MountRegistry } from '../mountRegistry';
import { jsx as _jsx } from "react/jsx-runtime";
const UIManagerAny = UIManager;
customDirectEventTypes.topGestureHandlerEvent = {
  registrationName: 'onGestureHandlerEvent'
};
const customGHEventsConfigFabricAndroid = {
  topOnGestureHandlerEvent: {
    registrationName: 'onGestureHandlerEvent'
  },
  topOnGestureHandlerStateChange: {
    registrationName: 'onGestureHandlerStateChange'
  }
};
const customGHEventsConfig = {
  onGestureHandlerEvent: {
    registrationName: 'onGestureHandlerEvent'
  },
  onGestureHandlerStateChange: {
    registrationName: 'onGestureHandlerStateChange'
  },
  // When using React Native Gesture Handler for Animated.event with useNativeDriver: true
  // on Android with Fabric enabled, the native part still sends the native events to JS
  // but prefixed with "top". We cannot simply rename the events above so they are prefixed
  // with "top" instead of "on" because in such case Animated.events would not be registered.
  // That's why we need to register another pair of event names.
  // The incoming events will be queued but never handled.
  // Without this piece of code below, you'll get the following JS error:
  // Unsupported top level event type "topOnGestureHandlerEvent" dispatched
  ...(isFabric() && Platform.OS === 'android' && customGHEventsConfigFabricAndroid)
};

// Add gesture specific events to genericDirectEventTypes object exported from UIManager
// native module.
// Once new event types are registered with react it is possible to dispatch these
// events to all kind of native views.
UIManagerAny.genericDirectEventTypes = {
  ...UIManagerAny.genericDirectEventTypes,
  ...customGHEventsConfig
};
const UIManagerConstants = UIManagerAny.getViewManagerConfig?.('getConstants');
if (UIManagerConstants) {
  UIManagerConstants.genericDirectEventTypes = {
    ...UIManagerConstants.genericDirectEventTypes,
    ...customGHEventsConfig
  };
}

// Wrap JS responder calls and notify gesture handler manager
const {
  setJSResponder: oldSetJSResponder = () => {
    // no-op
  },
  clearJSResponder: oldClearJSResponder = () => {
    // no-op
  }
} = UIManagerAny;
UIManagerAny.setJSResponder = (tag, blockNativeResponder) => {
  RNGestureHandlerModule.handleSetJSResponder(tag, blockNativeResponder);
  oldSetJSResponder(tag, blockNativeResponder);
};
UIManagerAny.clearJSResponder = () => {
  RNGestureHandlerModule.handleClearJSResponder();
  oldClearJSResponder();
};
let allowTouches = true;
const DEV_ON_ANDROID = __DEV__ && Platform.OS === 'android';
// Toggled inspector blocks touch events in order to allow inspecting on Android
// This needs to be a global variable in order to set initial state for `allowTouches` property in Handler component
if (DEV_ON_ANDROID) {
  DeviceEventEmitter.addListener('toggleElementInspector', () => {
    allowTouches = !allowTouches;
  });
}
function hasUnresolvedRefs(props) {
  // TODO(TS) - add type for extract arg
  const extract = refs => {
    if (!Array.isArray(refs)) {
      return refs && refs.current === null;
    }
    return refs.some(r => r && r.current === null);
  };
  return extract(props['simultaneousHandlers']) || extract(props['waitFor']);
}
const stateToPropMappings = {
  [State.UNDETERMINED]: undefined,
  [State.BEGAN]: 'onBegan',
  [State.FAILED]: 'onFailed',
  [State.CANCELLED]: 'onCancelled',
  [State.ACTIVE]: 'onActivated',
  [State.END]: 'onEnded'
};

// TODO(TS) fix event types

const UNRESOLVED_REFS_RETRY_LIMIT = 1;

// TODO(TS) - make sure that BaseGestureHandlerProps doesn't need other generic parameter to work with custom properties.
export default function createHandler({
  name,
  allowedProps = [],
  config = {},
  transformProps,
  customNativeProps = []
}) {
  class Handler extends React.Component {
    static displayName = name;
    static contextType = GestureHandlerRootViewContext;
    handlerTag = -1;
    constructor(props) {
      super(props);
      this.config = {};
      this.propsRef = /*#__PURE__*/React.createRef();
      this.isMountedRef = /*#__PURE__*/React.createRef();
      this.state = {
        allowTouches
      };
      if (props.id) {
        if (handlerIDToTag[props.id] !== undefined) {
          throw new Error(`Handler with ID "${props.id}" already registered`);
        }
        handlerIDToTag[props.id] = this.handlerTag;
      }
    }
    componentDidMount() {
      const props = this.props;
      this.isMountedRef.current = true;
      if (DEV_ON_ANDROID) {
        this.inspectorToggleListener = DeviceEventEmitter.addListener('toggleElementInspector', () => {
          this.setState(_ => ({
            allowTouches
          }));
          this.update(UNRESOLVED_REFS_RETRY_LIMIT);
        });
      }
      if (hasUnresolvedRefs(props)) {
        // If there are unresolved refs (e.g. ".current" has not yet been set)
        // passed as `simultaneousHandlers` or `waitFor`, we enqueue a call to
        // _update method that will try to update native handler props using
        // queueMicrotask. This makes it so update() function gets called after all
        // react components are mounted and we expect the missing ref object to
        // be resolved by then.
        ghQueueMicrotask(() => {
          this.update(UNRESOLVED_REFS_RETRY_LIMIT);
        });
      }
      this.createGestureHandler(filterConfig(transformProps ? transformProps(this.props) : this.props, [...allowedProps, ...customNativeProps], config));
      if (!this.viewNode) {
        throw new Error(`[Gesture Handler] Failed to obtain view for ${Handler.displayName}. Note that old API doesn't support functional components.`);
      }
      this.attachGestureHandler(findNodeHandle(this.viewNode)); // TODO(TS) - check if this can be null
    }
    componentDidUpdate() {
      const viewTag = findNodeHandle(this.viewNode);
      if (this.viewTag !== viewTag) {
        this.attachGestureHandler(viewTag); // TODO(TS) - check interaction between _viewTag & findNodeHandle
      }
      this.update(UNRESOLVED_REFS_RETRY_LIMIT);
    }
    componentWillUnmount() {
      this.inspectorToggleListener?.remove();
      this.isMountedRef.current = false;
      if (Platform.OS !== 'web') {
        unregisterOldGestureHandler(this.handlerTag);
      }
      RNGestureHandlerModule.dropGestureHandler(this.handlerTag);
      scheduleFlushOperations();
      // We can't use this.props.id directly due to TS generic type narrowing bug, see https://github.com/microsoft/TypeScript/issues/13995 for more context
      const handlerID = this.props.id;
      if (handlerID) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete handlerIDToTag[handlerID];
      }
      MountRegistry.gestureHandlerWillUnmount(this);
    }
    onGestureHandlerEvent = event => {
      if (event.nativeEvent.handlerTag === this.handlerTag) {
        if (typeof this.props.onGestureEvent === 'function') {
          this.props.onGestureEvent?.(event);
        }
      } else {
        this.props.onGestureHandlerEvent?.(event);
      }
    };

    // TODO(TS) - make sure this is right type for event
    onGestureHandlerStateChange = event => {
      if (event.nativeEvent.handlerTag === this.handlerTag) {
        if (typeof this.props.onHandlerStateChange === 'function') {
          this.props.onHandlerStateChange?.(event);
        }
        const state = event.nativeEvent.state;
        const stateEventName = stateToPropMappings[state];
        const eventHandler = stateEventName && this.props[stateEventName];
        if (eventHandler && typeof eventHandler === 'function') {
          eventHandler(event);
        }
      } else {
        this.props.onGestureHandlerStateChange?.(event);
      }
    };
    refHandler = node => {
      this.viewNode = node;
      const child = React.Children.only(this.props.children);
      // @ts-ignore Since React 19 ref is accessible as standard prop
      // https://react.dev/blog/2024/04/25/react-19-upgrade-guide#deprecated-element-ref
      const ref = isReact19() ? child.props?.ref : child?.ref;
      if (!ref) {
        return;
      }
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    };
    createGestureHandler = newConfig => {
      this.handlerTag = getNextHandlerTag();
      this.config = newConfig;
      RNGestureHandlerModule.createGestureHandler(name, this.handlerTag, newConfig);
    };
    attachGestureHandler = newViewTag => {
      this.viewTag = newViewTag;
      if (Platform.OS === 'web') {
        // Typecast due to dynamic resolution, attachGestureHandler should have web version signature in this branch
        RNGestureHandlerModule.attachGestureHandler(this.handlerTag, newViewTag, ActionType.JS_FUNCTION_OLD_API,
        // ignored on web
        this.propsRef);
      } else {
        registerOldGestureHandler(this.handlerTag, {
          onGestureEvent: this.onGestureHandlerEvent,
          onGestureStateChange: this.onGestureHandlerStateChange
        });
        const actionType = (() => {
          const onGestureEvent = this.props?.onGestureEvent;
          const isGestureHandlerWorklet = onGestureEvent && ('current' in onGestureEvent || 'workletEventHandler' in onGestureEvent);
          const onHandlerStateChange = this.props?.onHandlerStateChange;
          const isStateChangeHandlerWorklet = onHandlerStateChange && ('current' in onHandlerStateChange || 'workletEventHandler' in onHandlerStateChange);
          const isReanimatedHandler = isGestureHandlerWorklet || isStateChangeHandlerWorklet;
          if (isReanimatedHandler) {
            // Reanimated worklet
            return ActionType.REANIMATED_WORKLET;
          } else if (onGestureEvent && '__isNative' in onGestureEvent) {
            // Animated.event with useNativeDriver: true
            return ActionType.NATIVE_ANIMATED_EVENT;
          } else {
            // JS callback or Animated.event with useNativeDriver: false
            return ActionType.JS_FUNCTION_OLD_API;
          }
        })();
        RNGestureHandlerModule.attachGestureHandler(this.handlerTag, newViewTag, actionType);
      }
      scheduleFlushOperations();
      ghQueueMicrotask(() => {
        MountRegistry.gestureHandlerWillMount(this);
      });
    };
    updateGestureHandler = newConfig => {
      this.config = newConfig;
      RNGestureHandlerModule.updateGestureHandler(this.handlerTag, newConfig);
      scheduleFlushOperations();
    };
    update(remainingTries) {
      if (!this.isMountedRef.current) {
        return;
      }
      const props = this.props;

      // When ref is set via a function i.e. `ref={(r) => refObject.current = r}` instead of
      // `ref={refObject}` it's possible that it won't be resolved in time. Seems like trying
      // again is easy enough fix.
      if (hasUnresolvedRefs(props) && remainingTries > 0) {
        ghQueueMicrotask(() => {
          this.update(remainingTries - 1);
        });
      } else {
        const newConfig = filterConfig(transformProps ? transformProps(this.props) : this.props, [...allowedProps, ...customNativeProps], config);
        if (!deepEqual(this.config, newConfig)) {
          this.updateGestureHandler(newConfig);
        }
      }
    }

    // eslint-disable-next-line @eslint-react/no-unused-class-component-members
    setNativeProps(updates) {
      const mergedProps = {
        ...this.props,
        ...updates
      };
      const newConfig = filterConfig(transformProps ? transformProps(mergedProps) : mergedProps, [...allowedProps, ...customNativeProps], config);
      this.updateGestureHandler(newConfig);
    }
    render() {
      if (__DEV__ && !this.context && !isTestEnv() && Platform.OS !== 'web') {
        throw new Error(name + ' must be used as a descendant of GestureHandlerRootView. Otherwise the gestures will not be recognized. See https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation for more details.');
      }
      let gestureEventHandler = this.onGestureHandlerEvent;
      // Another instance of https://github.com/microsoft/TypeScript/issues/13995

      const {
        onGestureEvent,
        onGestureHandlerEvent
      } = this.props;
      if (onGestureEvent && typeof onGestureEvent !== 'function') {
        // If it's not a method it should be an native Animated.event
        // object. We set it directly as the handler for the view
        // In this case nested handlers are not going to be supported
        if (onGestureHandlerEvent) {
          throw new Error('Nesting touch handlers with native animated driver is not supported yet');
        }
        gestureEventHandler = onGestureEvent;
      } else {
        if (onGestureHandlerEvent && typeof onGestureHandlerEvent !== 'function') {
          throw new Error('Nesting touch handlers with native animated driver is not supported yet');
        }
      }
      let gestureStateEventHandler = this.onGestureHandlerStateChange;
      // Another instance of https://github.com/microsoft/TypeScript/issues/13995

      const {
        onHandlerStateChange,
        onGestureHandlerStateChange
      } = this.props;
      if (onHandlerStateChange && typeof onHandlerStateChange !== 'function') {
        // If it's not a method it should be an native Animated.event
        // object. We set it directly as the handler for the view
        // In this case nested handlers are not going to be supported
        if (onGestureHandlerStateChange) {
          throw new Error('Nesting touch handlers with native animated driver is not supported yet');
        }
        gestureStateEventHandler = onHandlerStateChange;
      } else {
        if (onGestureHandlerStateChange && typeof onGestureHandlerStateChange !== 'function') {
          throw new Error('Nesting touch handlers with native animated driver is not supported yet');
        }
      }
      const events = {
        onGestureHandlerEvent: this.state.allowTouches ? gestureEventHandler : undefined,
        onGestureHandlerStateChange: this.state.allowTouches ? gestureStateEventHandler : undefined
      };
      this.propsRef.current = events;
      let child = null;
      try {
        child = React.Children.only(this.props.children);
      } catch (e) {
        throw new Error(tagMessage(`${name} got more than one view as a child. If you want the gesture to work on multiple views, wrap them with a common parent and attach the gesture to that view.`));
      }
      let grandChildren = child.props.children;
      if (__DEV__ && child.type && (child.type === 'RNGestureHandlerButton' || child.type.name === 'View' || child.type.displayName === 'View')) {
        grandChildren = React.Children.toArray(grandChildren);
        grandChildren.push(/*#__PURE__*/_jsx(PressabilityDebugView, {
          color: "mediumspringgreen",
          hitSlop: child.props.hitSlop
        }, "pressabilityDebugView"));
      }
      return /*#__PURE__*/React.cloneElement(child, {
        ref: this.refHandler,
        collapsable: false,
        ...(isTestEnv() ? {
          handlerType: name,
          handlerTag: this.handlerTag,
          enabled: this.props.enabled
        } : {}),
        testID: this.props.testID ?? child.props.testID,
        ...events
      }, grandChildren);
    }
  }
  return Handler;
}
//# sourceMappingURL=createHandler.js.map