"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.camelCaseToDashed = void 0;
exports.encodeSvg = encodeSvg;
exports.getBoundingClientRect = void 0;
exports.remeasure = remeasure;
const camelCaseToDashed = camelCase => {
  return camelCase.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
};
exports.camelCaseToDashed = camelCaseToDashed;
const getBoundingClientRect = node => {
  if (node) {
    const isElement = node.nodeType === 1; /* Node.ELEMENT_NODE */
    if (isElement && typeof node.getBoundingClientRect === 'function') {
      return node.getBoundingClientRect();
    }
  }
  throw new Error('Can not get boundingClientRect of ' + node || 'undefined');
};
exports.getBoundingClientRect = getBoundingClientRect;
const measureLayout = (node, callback) => {
  const relativeNode = node === null || node === void 0 ? void 0 : node.parentNode;
  if (relativeNode) {
    setTimeout(() => {
      // @ts-expect-error TODO: handle it better
      const relativeRect = getBoundingClientRect(relativeNode);
      const {
        height,
        left,
        top,
        width
      } = getBoundingClientRect(node);
      const x = left - relativeRect.left;
      const y = top - relativeRect.top;
      callback(x, y, width, height, left, top);
    }, 0);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function remeasure() {
  const tag = this.state.touchable.responderID;
  if (tag === null) {
    return;
  }
  measureLayout(tag, this._handleQueryLayout);
}

/* Taken from here: https://gist.github.com/jennyknuth/222825e315d45a738ed9d6e04c7a88d0 */
function encodeSvg(svgString) {
  return svgString.replace('<svg', ~svgString.indexOf('xmlns') ? '<svg' : '<svg xmlns="http://www.w3.org/2000/svg"').replace(/"/g, "'").replace(/%/g, '%25').replace(/#/g, '%23').replace(/{/g, '%7B').replace(/}/g, '%7D').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/\s+/g, ' ');
}
//# sourceMappingURL=index.js.map