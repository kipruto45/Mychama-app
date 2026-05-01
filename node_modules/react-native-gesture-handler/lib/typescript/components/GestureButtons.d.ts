import * as React from 'react';
import type { BaseButtonProps, RectButtonProps, BorderlessButtonProps } from './GestureButtonsProps';
export declare const RawButton: React.ForwardRefExoticComponent<import("./GestureButtonsProps").RawButtonProps & import("..").NativeViewGestureHandlerProps & React.RefAttributes<React.ComponentType<any>>>;
export declare const BaseButton: React.ForwardRefExoticComponent<Omit<BaseButtonProps, "innerRef"> & React.RefAttributes<React.ComponentType<{}>>>;
export declare const RectButton: React.ForwardRefExoticComponent<Omit<RectButtonProps, "innerRef"> & React.RefAttributes<React.ComponentType<{}>>>;
export declare const BorderlessButton: React.ForwardRefExoticComponent<Omit<BorderlessButtonProps, "innerRef"> & React.RefAttributes<React.ComponentType<{}>>>;
export { default as PureNativeButton } from './GestureHandlerButton';
//# sourceMappingURL=GestureButtons.d.ts.map