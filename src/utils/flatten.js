/* istanbul ignore next */
const isObject = test => test && typeof test === 'object' && !Array.isArray(test);

/**
 * Flatten component and "named component" ({ main: cmp, aside: cmp}) array
 * into single array.
 */
export default components => (Array.isArray(components) ? components : [components])
  .reduce((acc, component) => acc.concat(isObject(component)
      ? Object.keys(component).reduce((prev, key) => prev.concat(component[key]), [])
      : component),
 []);
