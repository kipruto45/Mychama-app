'use strict';

import { logger } from '../common';
export function scrollTo(animatedRef, x, y, animated) {
  const element = animatedRef();

  // This prevents crashes if ref has not been set yet
  if (!element) {
    logger.warn('Called scrollTo() with an uninitialized ref. Make sure to pass the animated ref to the scrollable component before calling scrollTo().');
    return;
  }

  // By ScrollView we mean any scrollable component
  const scrollView = element;
  scrollView?.scrollTo({
    x,
    y,
    animated
  });
}
//# sourceMappingURL=scrollTo.web.js.map