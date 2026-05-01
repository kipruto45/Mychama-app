"use strict";

import * as React from 'react';
import GenericTouchable from './GenericTouchable';

/**
 * @deprecated TouchableWithoutFeedback will be removed in the future version of Gesture Handler. Use Pressable instead.
 */
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @deprecated TouchableWithoutFeedback will be removed in the future version of Gesture Handler. Use Pressable instead.
 */
const TouchableWithoutFeedback = /*#__PURE__*/React.forwardRef(({
  delayLongPress = 600,
  extraButtonProps = {
    rippleColor: 'transparent',
    exclusive: true
  },
  ...rest
}, ref) => /*#__PURE__*/_jsx(GenericTouchable, {
  ref: ref,
  delayLongPress: delayLongPress,
  extraButtonProps: extraButtonProps,
  ...rest
}));
export default TouchableWithoutFeedback;
//# sourceMappingURL=TouchableWithoutFeedback.js.map