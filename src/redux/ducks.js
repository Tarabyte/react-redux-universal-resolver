import reducer from './reducer';
export const KEY = '@@resolve';
export const RESOLVE_START = `${KEY}/start`;
export const RESOLVE_RESOLVED = `${KEY}/resolved`;
export const RESOLVE_REJECTED = `${KEY}/rejected`;


export const start = (key, promise) => ({
  type: RESOLVE_START,
  payload: { key, promise }
});

export const resolve = (key, result) => ({
  type: RESOLVE_RESOLVED,
  payload: { key, result }
});

export const reject = (key, error) => ({
  type: RESOLVE_REJECTED,
  payload: { key, error }
});


export default reducer({
  [RESOLVE_START]: (state, action) => {
    const { payload } = action;
    const { key, promise } = payload;

    return {
      ...state,
      [key]: {
        resolving: true,
        resolved: false,
        rejected: false,
        promise
      }
    };
  },

  [RESOLVE_RESOLVED]: (state, action) => {
    const { payload } = action;
    const { key, result } = payload;

    return {
      ...state,
      [key]: {
        resolving: false,
        resolved: true,
        rejected: false,
        result
      }
    };
  },

  [RESOLVE_REJECTED]: (state, action) => {
    const { payload } = action;
    const { key, error } = payload;

    return {
      ...state,
      [key]: {
        resolving: false,
        resolved: false,
        rejected: true,
        error
      }
    };
  }
})({});

