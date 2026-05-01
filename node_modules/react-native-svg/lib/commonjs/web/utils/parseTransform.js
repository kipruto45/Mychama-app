"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseTransformProp = parseTransformProp;
exports.stringifyTransformProps = stringifyTransformProps;
var _extractTransform = require("../../lib/extract/extractTransform");
function parseTransformProp(transform, props) {
  const transformArray = [];
  props && transformArray.push(...stringifyTransformProps(props));
  if (Array.isArray(transform)) {
    if (typeof transform[0] === 'number') {
      transformArray.push(`matrix(${transform.join(' ')})`);
    } else {
      const stringifiedProps = (0, _extractTransform.transformsArrayToProps)(
      // @ts-expect-error FIXME
      transform);
      transformArray.push(...stringifyTransformProps(stringifiedProps));
    }
  } else if (typeof transform === 'string') {
    transformArray.push(transform);
  }
  return transformArray.length ? transformArray.join(' ') : undefined;
}
function stringifyTransformProps(transformProps) {
  const transformArray = [];
  if (transformProps.translate != null) {
    transformArray.push(`translate(${transformProps.translate})`);
  }
  if (transformProps.translateX != null || transformProps.translateY != null) {
    transformArray.push(`translate(${transformProps.translateX || 0}, ${transformProps.translateY || 0})`);
  }
  if (transformProps.scale != null) {
    transformArray.push(`scale(${transformProps.scale})`);
  }
  if (transformProps.scaleX != null || transformProps.scaleY != null) {
    transformArray.push(`scale(${transformProps.scaleX || 1}, ${transformProps.scaleY || 1})`);
  }
  // rotation maps to rotate, not to collide with the text rotate attribute (which acts per glyph rather than block)
  if (transformProps.rotation != null) {
    transformArray.push(`rotate(${transformProps.rotation})`);
  }
  if (transformProps.skewX != null) {
    transformArray.push(`skewX(${transformProps.skewX})`);
  }
  if (transformProps.skewY != null) {
    transformArray.push(`skewY(${transformProps.skewY})`);
  }
  return transformArray;
}
//# sourceMappingURL=parseTransform.js.map