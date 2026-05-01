import { GestureType } from './handlers/gestures/gesture';
interface ReactComponentWithHandlerTag extends React.Component {
    handlerTag: number;
}
export type GestureMountListener = (gesture: GestureType | ReactComponentWithHandlerTag) => void;
export declare class MountRegistry {
    private static mountListeners;
    private static unmountListeners;
    static addMountListener(listener: GestureMountListener): () => void;
    static addUnmountListener(listener: GestureMountListener): () => void;
    static gestureHandlerWillMount(handler: React.Component): void;
    static gestureHandlerWillUnmount(handler: React.Component): void;
    static gestureWillMount(gesture: GestureType): void;
    static gestureWillUnmount(gesture: GestureType): void;
}
export {};
//# sourceMappingURL=mountRegistry.d.ts.map