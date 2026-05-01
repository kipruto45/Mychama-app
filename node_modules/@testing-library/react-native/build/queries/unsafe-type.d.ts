import type * as React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
export type UnsafeComponentType = React.ComponentType<any>;
export type UnsafeByTypeQueries = {
    UNSAFE_getByType: <P>(type: React.ComponentType<P>) => ReactTestInstance;
    UNSAFE_getAllByType: <P>(type: React.ComponentType<P>) => Array<ReactTestInstance>;
    UNSAFE_queryByType: <P>(type: React.ComponentType<P>) => ReactTestInstance | null;
    UNSAFE_queryAllByType: <P>(type: React.ComponentType<P>) => Array<ReactTestInstance>;
};
export declare const bindUnsafeByTypeQueries: (instance: ReactTestInstance) => UnsafeByTypeQueries;
