import * as React from 'react';
import { View } from 'react-native';
// Wrapping children in a View and div can cause styling issues
// but with the current implementation of react-native-web
// we can't avoid it.
//
// <View unknown-prop /> the prop is dropped by react-native-web
// https://github.com/necolas/react-native-web/blob/a5ba27c6226aa182979a9cff8cc23c0f5caa4d88/packages/react-native-web/src/exports/View/index.js#L47
//
// So we need to wrap the children in a react-dom div.
// We are using className instead of data-attribute to
// allow for easier CSS styling adjustments.
const Mask = (props) => {
    return (React.createElement(View, Object.assign({}, props),
        React.createElement("div", { className: 'sentry-react-native-mask' }, props.children)));
};
const Unmask = (props) => {
    return (React.createElement(View, Object.assign({}, props),
        React.createElement("div", { className: 'sentry-react-native-unmask' }, props.children)));
};
export { Mask, Unmask };
//# sourceMappingURL=CustomMask.web.js.map