export type MapPropsFunction = (props: Record<string, unknown>) => Record<string, unknown>;
/**
 * Preserve props that are helpful in diagnosing test failures, while stripping rest
 */
export declare function defaultMapProps(props: Record<string, unknown>): Record<string, unknown>;
