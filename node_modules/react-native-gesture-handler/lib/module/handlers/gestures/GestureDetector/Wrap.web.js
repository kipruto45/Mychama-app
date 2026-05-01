"use strict";

import React, { forwardRef } from 'react';
import { tagMessage } from '../../../utils';
import { isRNSVGNode } from '../../../web/utils';
import { jsx as _jsx } from "react/jsx-runtime";
export const Wrap = /*#__PURE__*/forwardRef(({
  children
}, ref) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const child = React.Children.only(children);
    if (isRNSVGNode(child)) {
      const clone = /*#__PURE__*/React.cloneElement(child, {
        ref
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      child.props.children);
      return clone;
    }
    return /*#__PURE__*/_jsx("div", {
      ref: ref,
      style: {
        display: 'contents'
      },
      children: child
    });
  } catch (e) {
    throw new Error(tagMessage(`GestureDetector got more than one view as a child. If you want the gesture to work on multiple views, wrap them with a common parent and attach the gesture to that view.`));
  }
});

// On web we never take a path with Reanimated,
// therefore we can simply export Wrap
export const AnimatedWrap = Wrap;
//# sourceMappingURL=Wrap.web.js.map