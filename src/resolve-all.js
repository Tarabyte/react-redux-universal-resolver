import flatten from './utils/flatten';
import invariant from 'invariant';

export default (components, ...args) => {
  invariant(components,
    'Expecting components array or single components. Got %s instead.', components);

  const pending = flatten(components)
    .filter(component => typeof component.resolveOnServer === 'function')
    .map(component => component.resolveOnServer(...args));

  return Promise.all(pending);
};
