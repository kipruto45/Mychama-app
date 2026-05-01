'use strict';

import { makeMutable } from './core';
export function makeViewDescriptorsSet() {
  const shareableViewDescriptors = makeMutable([]);
  const viewTags = new Set();
  const data = {
    shareableViewDescriptors,
    add: (item, updaterContainer) => {
      viewTags.add(item.tag);
      const updater = updaterContainer?.current;
      shareableViewDescriptors.modify(descriptors => {
        'worklet';

        const index = descriptors.findIndex(descriptor => descriptor.tag === item.tag);
        if (index !== -1) {
          descriptors[index] = item;
        } else {
          descriptors.push(item);
        }
        updater?.(true);
        return descriptors;
      }, false);
    },
    remove: viewTag => {
      viewTags.delete(viewTag);
      shareableViewDescriptors.modify(descriptors => {
        'worklet';

        const index = descriptors.findIndex(descriptor => descriptor.tag === viewTag);
        if (index !== -1) {
          descriptors.splice(index, 1);
        }
        return descriptors;
      }, false);
    },
    has: viewTag => viewTags.has(viewTag)
  };
  return data;
}
//# sourceMappingURL=ViewDescriptorsSet.js.map