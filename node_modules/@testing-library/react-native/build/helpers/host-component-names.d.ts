import type { ReactTestInstance } from 'react-test-renderer';
import type { HostTestInstance } from './component-tree';
/**
 * Checks if the given element is a host Text element.
 * @param element The element to check.
 */
export declare function isHostText(element: ReactTestInstance): element is HostTestInstance;
/**
 * Checks if the given element is a host TextInput element.
 * @param element The element to check.
 */
export declare function isHostTextInput(element: ReactTestInstance): element is HostTestInstance;
/**
 * Checks if the given element is a host Image element.
 * @param element The element to check.
 */
export declare function isHostImage(element: ReactTestInstance): element is HostTestInstance;
/**
 * Checks if the given element is a host Switch element.
 * @param element The element to check.
 */
export declare function isHostSwitch(element: ReactTestInstance): element is HostTestInstance;
/**
 * Checks if the given element is a host ScrollView element.
 * @param element The element to check.
 */
export declare function isHostScrollView(element: ReactTestInstance): element is HostTestInstance;
/**
 * Checks if the given element is a host Modal element.
 * @param element The element to check.
 */
export declare function isHostModal(element: ReactTestInstance): element is HostTestInstance;
