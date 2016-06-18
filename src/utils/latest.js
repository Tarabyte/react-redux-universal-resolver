/**
 * Makes function wrapper that wraps a given function
 * and ensures only latest function will be called no matter
 * when it will be called.
 */
export default () => {
  let frame = 0;
  return fn => {
    const snapshot = ++frame;

    return (...args) => {
      if (snapshot === frame) {
        fn(...args);
      }
    };
  };
};
