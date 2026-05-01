import type { ReactTestInstance } from 'react-test-renderer';
type Props = Record<string, unknown>;
export type UnsafeByPropsQueries = {
    UNSAFE_getByProps: (props: Props) => ReactTestInstance;
    UNSAFE_getAllByProps: (props: Props) => Array<ReactTestInstance>;
    UNSAFE_queryByProps: (props: Props) => ReactTestInstance | null;
    UNSAFE_queryAllByProps: (props: Props) => Array<ReactTestInstance>;
};
export declare const bindUnsafeByPropsQueries: (instance: ReactTestInstance) => UnsafeByPropsQueries;
export {};
