import { addBreadcrumb, debug, dropUndefinedKeys, getClient, SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN } from '@sentry/core';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { createIntegration } from './integrations/factory';
import { startUserInteractionSpan } from './tracing/integrations/userInteraction';
import { UI_ACTION_TOUCH } from './tracing/ops';
import { SPAN_ORIGIN_AUTO_INTERACTION } from './tracing/origin';
const touchEventStyles = StyleSheet.create({
    wrapperView: {
        flex: 1,
    },
});
const DEFAULT_BREADCRUMB_CATEGORY = 'touch';
const DEFAULT_BREADCRUMB_TYPE = 'user';
const DEFAULT_MAX_COMPONENT_TREE_SIZE = 20;
const SENTRY_LABEL_PROP_KEY = 'sentry-label';
const SENTRY_COMPONENT_PROP_KEY = 'data-sentry-component';
const SENTRY_ELEMENT_PROP_KEY = 'data-sentry-element';
const SENTRY_FILE_PROP_KEY = 'data-sentry-source-file';
/**
 * Boundary to log breadcrumbs for interaction events.
 */
class TouchEventBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.name = 'TouchEventBoundary';
    }
    /**
     * Registers the TouchEventBoundary as a Sentry Integration.
     */
    componentDidMount() {
        var _a;
        const client = getClient();
        (_a = client === null || client === void 0 ? void 0 : client.addIntegration) === null || _a === void 0 ? void 0 : _a.call(client, createIntegration(this.name));
    }
    /**
     *
     */
    render() {
        return (React.createElement(View, { style: touchEventStyles.wrapperView, 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onTouchStart: this._onTouchStart.bind(this) }, this.props.children));
    }
    /**
     * Logs the touch event given the component tree names and a label.
     */
    _logTouchEvent(touchPath, label) {
        const level = 'info';
        const root = touchPath[0];
        if (!root) {
            debug.warn('[TouchEvents] No root component found in touch path.');
            return;
        }
        const detail = label ? label : `${root.name}${root.file ? ` (${root.file})` : ''}`;
        const crumb = {
            category: this.props.breadcrumbCategory,
            data: { path: touchPath },
            level: level,
            message: `Touch event within element: ${detail}`,
            type: this.props.breadcrumbType,
        };
        addBreadcrumb(crumb);
        debug.log(`[TouchEvents] ${crumb.message}`);
    }
    /**
     * Checks if the name is supposed to be ignored.
     */
    _isNameIgnored(name) {
        let ignoreNames = this.props.ignoreNames || [];
        // eslint-disable-next-line deprecation/deprecation
        if (this.props.ignoredDisplayNames) {
            // This is to make it compatible with prior version.
            // eslint-disable-next-line deprecation/deprecation
            ignoreNames = [...ignoreNames, ...this.props.ignoredDisplayNames];
        }
        return ignoreNames.some((ignoreName) => (typeof ignoreName === 'string' && name === ignoreName) ||
            (ignoreName instanceof RegExp && name.match(ignoreName)));
    }
    // Originally was going to clean the names of any HOCs as well but decided that it might hinder debugging effectively. Will leave here in case
    // private readonly _cleanName = (name: string): string =>
    //   name.replace(/.*\(/g, "").replace(/\)/g, "");
    /**
     * Traverses through the component tree when a touch happens and logs it.
     * @param e
     */
    // eslint-disable-next-line complexity
    _onTouchStart(e) {
        var _a, _b;
        if (!e._targetInst) {
            return;
        }
        let currentInst = e._targetInst;
        const touchPath = [];
        while (currentInst &&
            // maxComponentTreeSize will always be defined as we have a defaultProps. But ts needs a check so this is here.
            this.props.maxComponentTreeSize &&
            touchPath.length < this.props.maxComponentTreeSize) {
            if (
            // If the loop gets to the boundary itself, break.
            ((_a = currentInst.elementType) === null || _a === void 0 ? void 0 : _a.displayName) === TouchEventBoundary.displayName) {
                break;
            }
            const info = getTouchedComponentInfo(currentInst, this.props.labelName);
            this._pushIfNotIgnored(touchPath, info);
            currentInst = currentInst.return;
        }
        const label = (_b = touchPath.find(info => info.label)) === null || _b === void 0 ? void 0 : _b.label;
        if (touchPath.length > 0) {
            this._logTouchEvent(touchPath, label);
        }
        const span = startUserInteractionSpan({
            elementId: label,
            op: UI_ACTION_TOUCH,
        });
        if (span) {
            span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, SPAN_ORIGIN_AUTO_INTERACTION);
        }
    }
    /**
     * Pushes the name to the componentTreeNames array if it is not ignored.
     */
    _pushIfNotIgnored(touchPath, value) {
        if (!value) {
            return false;
        }
        if (!value.name && !value.label) {
            return false;
        }
        if (value.name && this._isNameIgnored(value.name)) {
            return false;
        }
        if (value.label && this._isNameIgnored(value.label)) {
            return false;
        }
        // Deduplicate same subsequent items.
        if (touchPath.length > 0 && JSON.stringify(touchPath[touchPath.length - 1]) === JSON.stringify(value)) {
            return false;
        }
        touchPath.push(value);
        return true;
    }
}
TouchEventBoundary.displayName = '__Sentry.TouchEventBoundary';
TouchEventBoundary.defaultProps = {
    breadcrumbCategory: DEFAULT_BREADCRUMB_CATEGORY,
    breadcrumbType: DEFAULT_BREADCRUMB_TYPE,
    ignoreNames: [],
    maxComponentTreeSize: DEFAULT_MAX_COMPONENT_TREE_SIZE,
};
function getTouchedComponentInfo(currentInst, labelKey) {
    var _a;
    const displayName = (_a = currentInst.elementType) === null || _a === void 0 ? void 0 : _a.displayName;
    const props = currentInst.memoizedProps;
    if (!props) {
        // Early return if no props are available, as we can't extract any useful information
        if (displayName) {
            return {
                name: displayName,
            };
        }
        return undefined;
    }
    return dropUndefinedKeys({
        // provided by @sentry/babel-plugin-component-annotate
        name: getComponentName(props) || displayName,
        element: getElementName(props),
        file: getFileName(props),
        // `sentry-label` or user defined label key
        label: getLabelValue(props, labelKey),
    });
}
function getComponentName(props) {
    return typeof props[SENTRY_COMPONENT_PROP_KEY] === 'string' &&
        props[SENTRY_COMPONENT_PROP_KEY].length > 0 &&
        props[SENTRY_COMPONENT_PROP_KEY] !== 'unknown' &&
        props[SENTRY_COMPONENT_PROP_KEY] || undefined;
}
function getElementName(props) {
    return typeof props[SENTRY_ELEMENT_PROP_KEY] === 'string' &&
        props[SENTRY_ELEMENT_PROP_KEY].length > 0 &&
        props[SENTRY_ELEMENT_PROP_KEY] !== 'unknown' &&
        props[SENTRY_ELEMENT_PROP_KEY] || undefined;
}
function getFileName(props) {
    return typeof props[SENTRY_FILE_PROP_KEY] === 'string' &&
        props[SENTRY_FILE_PROP_KEY].length > 0 &&
        props[SENTRY_FILE_PROP_KEY] !== 'unknown' &&
        props[SENTRY_FILE_PROP_KEY] || undefined;
}
function getLabelValue(props, labelKey) {
    return typeof props[SENTRY_LABEL_PROP_KEY] === 'string' && props[SENTRY_LABEL_PROP_KEY].length > 0
        ? props[SENTRY_LABEL_PROP_KEY]
        // For some reason type narrowing doesn't work as expected with indexing when checking it all in one go in
        // the "check-label" if sentence, so we have to assign it to a variable here first
        : typeof labelKey === 'string' && typeof props[labelKey] == 'string' && props[labelKey].length > 0
            ? props[labelKey]
            : undefined;
}
/**
 * Convenience Higher-Order-Component for TouchEventBoundary
 * @param WrappedComponent any React Component
 * @param boundaryProps TouchEventBoundaryProps
 */
const withTouchEventBoundary = (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
InnerComponent, boundaryProps) => {
    const WrappedComponent = props => (React.createElement(TouchEventBoundary, Object.assign({}, (boundaryProps !== null && boundaryProps !== void 0 ? boundaryProps : {})),
        React.createElement(InnerComponent, Object.assign({}, props))));
    WrappedComponent.displayName = 'WithTouchEventBoundary';
    return WrappedComponent;
};
export { TouchEventBoundary, withTouchEventBoundary };
//# sourceMappingURL=touchevents.js.map