import * as React from 'react';
import type { HostComponent, ViewProps } from 'react-native';
declare const MaskFallback: (viewProps: ViewProps) => React.ReactElement;
declare const UnmaskFallback: (viewProps: ViewProps) => React.ReactElement;
declare const Mask: HostComponent<ViewProps> | React.ComponentType<ViewProps>;
declare const Unmask: HostComponent<ViewProps> | React.ComponentType<ViewProps>;
export { Mask, Unmask, MaskFallback, UnmaskFallback };
//# sourceMappingURL=CustomMask.d.ts.map