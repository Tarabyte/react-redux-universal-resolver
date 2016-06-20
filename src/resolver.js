import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import shallowequal from 'shallowequal';
import { start, resolve, reject } from './ducks';
import latest from './utils/latest';
import invariant from 'invariant';
import hoistStatics from 'hoist-non-react-statics';

const { any, bool, object, func } = PropTypes;

const defaultMapStateToParams = (state, ownProps) => ownProps.params;
const defaultMapRouteToParams = (state, routeProps) => routeProps.params;
const isObject = test => test && typeof test === 'object' && !Array.isArray(test);
const defaultOptions = {
  pure: true,
  hoistNonReactStatics: true
};
const defaultSlice = state => state.resolver;
const extract = value => {
  if (value != null) {
    /* istanbul ignore else */
    if (value.resolving) {
      return value.promise;
    } else if (value.rejected) {
      return value.error;
    } else if (value.resolved) {
      return value.result;
    }
    // sanity check failed :)
    /* istanbul ignore next */
    invariant(false,
      'Inconsistent state. Value should be either resolving, resolved, or rejected.');
  }

  return null;
};

const makeMapParamsToPromises = hash => {
  const promiseThunks = Object.keys(hash).map(key => {
    const fn = hash[key];
    return (acc, params) => Object.assign(acc, { [key]: fn(params) });
  });

  return params => promiseThunks.reduce((acc, thunk) => thunk(acc, params), {});
};

export default (mapParamsToPromises,
                mapStateToParams = defaultMapStateToParams,
                mapRouteToParams = defaultMapRouteToParams,
                options = {}) => {
  invariant(isObject(mapParamsToPromises),
    'Expecting mapParamsToPromises to be an object. Got %s instead.', mapParamsToPromises);

  invariant(mapParamsToPromises,
    'Expecting mapParamsToPromises to be not null. Got %s instead', mapParamsToPromises);

  invariant(typeof mapStateToParams === 'function',
    'Expecting mapStateToParams to be a function. Got %s instead', mapStateToParams);

  invariant(typeof mapRouteToParams === 'function',
    'Expecting mapRouteToParams to be a function. Got %s instead', mapRouteToParams);

  invariant(isObject(options),
    'Expecting options to be an object. Got %s instead.', options);

  const finalOptions = { ...defaultOptions, ...options };

  return (Fulfilled, Rejected, Pending) => {
    const keys = Object.keys(mapParamsToPromises);
    const finalMapParamsToPromises = makeMapParamsToPromises(mapParamsToPromises);
    const dispatchLatest = latest();
    const mapStateToProps = (state, ownProps) => {
      const resolveParams = mapStateToParams(state, ownProps);
      const stateSlice = (ownProps.slice || defaultSlice)(state);

      invariant(stateSlice,
       `Expecting state.resolver to be an object.
       If you use different name please provide slice function
       to map resolver state from global state object.`);

      const is = what => key => stateSlice[key] && stateSlice[key][what];

      const resolved = keys.every(is('resolved'));
      const rejected = keys.some(is('rejected'));
      const pending = !(resolved || rejected);

      // eslint-disable-next-line no-sequences, no-param-reassign, no-return-assign
      const result = keys.reduce((acc, key) => (acc[key] = extract(stateSlice[key]), acc), {});

      return {
        resolveParams,
        resolved,
        rejected,
        pending,
        result
      };
    };

    const resolvePromises = (params, dispatch) => {
      const promises = finalMapParamsToPromises(params);

      dispatch = dispatchLatest(dispatch); // eslint-disable-line no-param-reassign

      const pending = Object
        .keys(promises)
        .map(key => {
          const promise = promises[key];
          if (promise && typeof promise.then === 'function') {
            dispatch(start(key, promise));

            promise.then(
              result => dispatch(resolve(key, result)),
              error => dispatch(reject(key, error))
            );
          } else {
            dispatch(resolve(key, promise));
          }

          return promise;
        });

      return Promise.all(pending);
    };

    const { pure, hoistNonReactStatics } = finalOptions;
    const impure = !pure;

    class Resolver extends Component {
      static propTypes = {
        /**
         * Params required to compose promises to resolve.
         * For example current instance id to fetch that comes from router params
         */
        resolveParams: any.isRequired,

        /**
         * Wheater all promises are resolved
         */
        resolved: bool.isRequired,

        /**
         * If any promise is still pending
         */
        pending: bool.isRequired,

        /**
         * If any promise were rejected
         */
        rejected: bool.isRequired,

        /**
         * Hash of promises result
         */
        result: object,

        /**
         * Redux store dispatch
         */
        dispatch: func.isRequired
      };

      static resolveOnServer(state, routeProps, dispatch) {
        invariant(typeof dispatch === 'function',
          'Expecting dispatch to be a function. Got %s instead.', typeof dispatch);

        const resolveParams = mapRouteToParams(state, routeProps);
        return resolvePromises(resolveParams, dispatch);
      }

      componentDidMount() {
        const { pending, resolveParams, dispatch } = this.props;

        if (pending) {
          resolvePromises(resolveParams, dispatch);
        }
      }

      componentWillReceiveProps(nextProps) {
        const { resolveParams: oldParams, dispatch } = this.props;
        const { resolveParams: nextParams } = nextProps;
        if (!shallowequal(oldParams, nextParams)) {
          resolvePromises(nextParams, dispatch);
        }
      }

      shouldComponentUpdate(nextProps) {
        return impure || this.props.pending !== nextProps.pending;
      }

      render() {
        const {
          resolved,
          rejected,
          pending,
          result
        } = this.props;

        if (pending && Pending) {
          return <Pending />;
        } else if (rejected && Rejected) {
          return <Rejected {...result} />;
        } else if (resolved) {
          return <Fulfilled {...result} />;
        }

        return null;
      }
    }

    if (hoistNonReactStatics) {
      hoistStatics(Resolver, Fulfilled);
    }

    if (impure) {
      // say connect we have impure component inside
      return connect(mapStateToProps, undefined, undefined, {
        pure: false
      })(Resolver);
    }

    return connect(mapStateToProps)(Resolver);
  };
};
