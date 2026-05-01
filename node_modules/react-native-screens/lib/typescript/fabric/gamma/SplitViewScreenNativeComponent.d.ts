import type { ViewProps } from 'react-native';
import { DirectEventHandler, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
type GenericEmptyEvent = Readonly<{}>;
type SplitViewScreenColumnType = 'column' | 'inspector';
interface NativeProps extends ViewProps {
    columnType?: WithDefault<SplitViewScreenColumnType, 'column'>;
    onWillAppear?: DirectEventHandler<GenericEmptyEvent>;
    onDidAppear?: DirectEventHandler<GenericEmptyEvent>;
    onWillDisappear?: DirectEventHandler<GenericEmptyEvent>;
    onDidDisappear?: DirectEventHandler<GenericEmptyEvent>;
}
declare const _default: import("react-native/Libraries/Utilities/codegenNativeComponent").NativeComponentType<NativeProps>;
export default _default;
//# sourceMappingURL=SplitViewScreenNativeComponent.d.ts.map