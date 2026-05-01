import * as React from 'react';
import { act as reactTestRendererAct } from 'react-test-renderer';
type ReactAct = 0 extends 1 & typeof React.act ? typeof reactTestRendererAct : typeof React.act;
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
declare function setIsReactActEnvironment(isReactActEnvironment: boolean | undefined): void;
declare function getIsReactActEnvironment(): boolean | undefined;
declare const act: ReactAct;
export default act;
export { getIsReactActEnvironment, setIsReactActEnvironment as setReactActEnvironment };
