/**
 * Check if edge-to-edge is enabled through `react-native-edge-to-edge` library.
 * @returns A `boolean`, `true` on platforms other than Android.
 */
export declare const isEdgeToEdgeFromLibrary: () => boolean;
/**
 * Check if edge-to-edge is enabled through `edgeToEdgeEnabled` Gradle property.
 * @returns A `boolean`, `true` on platforms other than Android.
 */
export declare const isEdgeToEdgeFromProperty: () => boolean;
/**
 * Check if edge-to-edge is enabled, either from the library or the Gradle property.
 * @returns A `boolean`, `true` on platforms other than Android.
 */
export declare const isEdgeToEdge: () => boolean;
/**
 * In __DEV__ mode, warn when given values are ignored due to edge-to-edge being enabled.
 * @param values - A record of named values to check. Only defined values trigger a warning.
 */
export declare const controlEdgeToEdgeValues: (values: Record<string, unknown>) => void;
