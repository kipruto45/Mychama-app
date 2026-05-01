import { PressableEvent } from './PressableProps';
import { StateDefinition } from './StateMachine';
export declare enum StateMachineEvent {
    NATIVE_BEGIN = "nativeBegin",
    NATIVE_START = "nativeStart",
    FINALIZE = "finalize",
    LONG_PRESS_TOUCHES_DOWN = "longPressTouchesDown"
}
export declare function getStatesConfig(handlePressIn: (event: PressableEvent) => void, handlePressOut: (event: PressableEvent) => void): StateDefinition[];
//# sourceMappingURL=stateDefinitions.d.ts.map