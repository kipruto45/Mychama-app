import type { ReactTestInstance } from 'react-test-renderer';
import type { UserEventConfig, UserEventInstance } from '../setup';
export interface TypeOptions {
    skipPress?: boolean;
    submitEditing?: boolean;
    skipBlur?: boolean;
}
export declare function type(this: UserEventInstance, element: ReactTestInstance, text: string, options?: TypeOptions): Promise<void>;
type EmitTypingEventsContext = {
    config: UserEventConfig;
    key: string;
    text: string;
    isAccepted?: boolean;
};
export declare function emitTypingEvents(element: ReactTestInstance, { config, key, text, isAccepted }: EmitTypingEventsContext): Promise<void>;
export {};
