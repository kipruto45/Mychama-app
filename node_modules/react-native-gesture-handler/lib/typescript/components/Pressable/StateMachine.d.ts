import { PressableEvent } from './PressableProps';
export interface StateDefinition {
    eventName: string;
    callback?: (event: PressableEvent) => void;
}
declare class PressableStateMachine {
    private states;
    private currentStepIndex;
    private eventPayload;
    constructor();
    setStates(states: StateDefinition[]): void;
    reset(): void;
    handleEvent(eventName: string, eventPayload?: PressableEvent): void;
}
export { PressableStateMachine };
//# sourceMappingURL=StateMachine.d.ts.map