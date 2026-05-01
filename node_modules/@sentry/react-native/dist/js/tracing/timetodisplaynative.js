import * as React from 'react';
import { UIManager, View } from 'react-native';
import { isExpoGo } from '../utils/environment';
import { ReactNativeLibraries } from '../utils/rnlibraries';
const RNSentryOnDrawReporterClass = 'RNSentryOnDrawReporter';
export const nativeComponentExists = UIManager.hasViewManagerConfig
    ? UIManager.hasViewManagerConfig(RNSentryOnDrawReporterClass)
    : false;
/**
 * This is a fallback component for environments where the native component is not available.
 */
class RNSentryOnDrawReporterNoop extends React.Component {
    render() {
        return (React.createElement(View, Object.assign({}, this.props)));
    }
}
let RNSentryOnDrawReporter;
/**
 * Native component that reports the on draw timestamp.
 */
export const getRNSentryOnDrawReporter = () => {
    var _a;
    if (!RNSentryOnDrawReporter) {
        RNSentryOnDrawReporter = !isExpoGo() && nativeComponentExists && ((_a = ReactNativeLibraries.ReactNative) === null || _a === void 0 ? void 0 : _a.requireNativeComponent)
            ? ReactNativeLibraries.ReactNative.requireNativeComponent(RNSentryOnDrawReporterClass)
            : RNSentryOnDrawReporterNoop;
    }
    return RNSentryOnDrawReporter;
};
//# sourceMappingURL=timetodisplaynative.js.map