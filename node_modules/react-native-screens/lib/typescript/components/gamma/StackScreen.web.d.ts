import { View, ViewProps } from 'react-native';
interface NativeProps extends ViewProps {
}
export declare const StackScreenLifecycleState: {
    readonly INITIAL: 0;
    readonly DETACHED: 1;
    readonly ATTACHED: 2;
};
export type StackScreenNativeProps = NativeProps & {
    maxLifecycleState: (typeof StackScreenLifecycleState)[keyof typeof StackScreenLifecycleState];
};
declare const StackScreen: typeof View;
export default StackScreen;
//# sourceMappingURL=StackScreen.web.d.ts.map