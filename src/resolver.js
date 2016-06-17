import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import shallowequal from 'shallowequal';
import { start, resolve, reject } from './redux/ducks';
import latest from './latest';

const { any, bool, object, func } = PropTypes;

const isFunction = x => typeof x === 'function';
const defaultMapStateToParams = (state, ownProps) => ownProps.params;
const defaultMapRouteToParams = (state, routeProps) => routeProps.params;
const makeMapParamsToPromises = hash => params =>
  Object.keys(hash).reduce((acc, key) => Object.assign(acc, { key: hash[key](params) }), {});

const flatten = (components) => (Array.isArray(components) ? components : [components])
  .reduce((acc, component) => acc.concat(typeof component === 'object'
      ? Object.keys(component).reduce((prev, key) => prev.concat(component[key]), [])
      : component),
  []);

export const resolveOnServer = (components, ...args) => {
  const pending = flatten(components)
    .filter(component => isFunction(component.resolveOnServer))
    .map(component => component.resolveOnServer(...args));

  return Promise.all(pending);
};

export default (mapParamsToPromises,
                mapStateToParams = defaultMapStateToParams,
                mapRouteToParams = defaultMapRouteToParams) =>
  (Fulfilled, Rejected, Pending) => {
    const finalMapParamsToPromises =
      isFunction(mapParamsToPromises)
      ? mapParamsToPromises
      : makeMapParamsToPromises(mapParamsToPromises);


    const mapStateToProps = (state, ownProps) => {
      const resolveParams = mapStateToParams(state, ownProps);
      const keys = Object.keys(finalMapParamsToPromises(resolveParams));
      const stateSlice = state.resolver;
      const is = what => key => stateSlice[key] && stateSlice[key][what];

      const resolved = keys.every(is('resolved'));
      const rejected = keys.some(is('rejected'));
      const pending = !(resolved || rejected);

      const extract = is(rejected ? 'error' : 'result');
      // eslint-disable-next-line no-sequences, no-param-reassign, no-return-assign
      const result = keys.reduce((acc, key) => (acc[key] = extract(key), acc), {});

      return {
        resolveParams,
        resolved,
        rejected,
        pending,
        result
      };
    };

    const dispatchLatest = latest();

    const resolvePromises = (params, dispatch) => {
      const promises = finalMapParamsToPromises(params);

      dispatch = dispatchLatest(dispatch); // eslint-disable-line no-param-reassign

      const pending = Object
        .keys(promises)
        .map(key => {
          const promise = promises[key];
          dispatch(start(key, promise));

          promise.then(
            result => dispatch(resolve(key, result)),
            error => dispatch(reject(key, error))
          );

          return promise;
        });

      return Promise.all(pending);
    };

    class Resolver extends Component {
      static propTypes = {
        resolveParams: any.isRequired,
        resolved: bool.isRequired,
        pending: bool.isRequired,
        rejected: bool.isRequired,
        result: object,
        dispatch: func.isRequired
      };

      static resolveOnServer(state, routeProps, dispatch) {
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

      render() {
        const {
          resolved,
          rejected,
          pending,
          result
        } = this.props;

        if (pending && Pending) {
          return <Pending {...result} />;
        } else if (rejected && Rejected) {
          return <Rejected {...result} />;
        } else if (resolved) {
          return <Fulfilled {...result} />;
        }

        return null;
      }
    }

    return connect(mapStateToProps)(Resolver);
  };
