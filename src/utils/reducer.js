export default handlers => initial => (state = initial, action = {}) => {
  const handler = handlers[action.type];

  return handler ? handler(state, action) : state;
};
