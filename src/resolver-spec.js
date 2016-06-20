/* eslint no-console:0 no-unused-expressions:0 */
import React, { Component, PropTypes } from 'react';
import TestUtils from 'react-addons-test-utils';
import resolver from './resolver';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import reducer, {
  resolve as makeResolve,
  reject as makeReject,
  RESOLVE_START
} from './ducks';
import delay from 'delay';

const Debug = props => (
  <pre>{JSON.stringify(props, null, 2)}</pre>
);

const makeReducer = (name = 'resolver') => combineReducers({ [name]: reducer });
const makeStore = (initial = { resolver: {} }, middleware = []) =>
  createStore(makeReducer(), initial, applyMiddleware(...middleware));

describe('Resolver', () => {
  it('should be a function', () => {
    expect(resolver).to.be.a('function');
  });

  describe('Resolver Component', () => {
    it('should return a function', () => {
      expect(resolver({})(Debug)).to.be.a('function');
    });

    it('should call promise function if not loaded on componentDidMount', () => {
      const store = makeStore();
      const stub = sinon.stub().returns(Promise.resolve());
      const resolve = resolver({ stub });
      const Wrapped = resolve(Debug);
      const params = {
        id: 1
      };

      const component = (
        <Provider store={store}>
          <Wrapped params={params} />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      stub.calledOnce.should.be.true;

      stub.args[0].should.be.deep.equal([params]);
    });

    it('should NOT call promise function if loaded on componentDidMount', () => {
      const store = makeStore();
      const result = {};
      store.dispatch(makeResolve('stub', result));
      const stub = sinon.stub().returns(Promise.resolve());
      const resolve = resolver({ stub });
      const Wrapped = resolve(Debug);
      const params = {
        id: 1
      };

      const component = (
        <Provider store={store}>
          <Wrapped params={params} />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      stub.called.should.be.false;
    });

    it('should render custom Rejected component if provided', () => {
      const store = makeStore();
      const error = new Error('Test thing happend');
      store.dispatch(makeReject('stub', error));
      const stub = sinon.stub().returns(Promise.resolve());
      const rejected = sinon.stub().returns(null);
      const Wrapped = resolver({ stub })(Debug, rejected);
      const params = {
        id: 1
      };

      const component = (
        <Provider store={store}>
          <Wrapped params={params} />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      rejected.calledOnce.should.be.true;
    });

    it('should render custom Pending component if provided', () => {
      const store = makeStore();
      const stub = sinon.stub().returns(Promise.resolve());
      const pending = sinon.stub().returns(null);
      const Wrapped = resolver({ stub })(Debug, null, pending);
      const params = {
        id: 1
      };

      const component = (
        <Provider store={store}>
          <Wrapped params={params} />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      pending.calledOnce.should.be.true;
    });

    it('should await all promise before render', done => {
      const store = makeStore();
      const stub1 = () => delay(100, 1);
      const stub2 = () => delay(20, 2);
      const cmp = sinon.stub().returns(null);

      const Wrapped = resolver({ stub1, stub2 })(cmp);
      const params = {};

      const component = (
        <Provider store={store}>
          <Wrapped params={params} />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      const unsub = store.subscribe(() => {
        const state = store.getState().resolver;

        if (state.stub1.resolved && state.stub2.resolved) {
          cmp.calledOnce.should.be.true;
          cmp.args[0][0].should.be.deep.equal({
            stub1: 1,
            stub2: 2
          });
          unsub();
          done();
        }
      });
    });

    it('should publish start event for every key', () => {
      const record = sinon.stub();
      const collector = () => next => action => {
        record(action);
        return next(action);
      };

      const store = makeStore(undefined, [collector]);

      const Wrapped = resolver({
        stub1: () => Promise.resolve(1),
        stub2: () => Promise.reject(2)
      })(Debug);

      const params = {};

      const component = (
        <Provider store={store}>
          <Wrapped params={params} />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      record.args.should.have.length(2);
      record.args.forEach(([{ type }]) => type.should.be.equal(RESOLVE_START));
    });

    it('should allow to pass custom mapStateToParams', () => {
      const params = { foo: 'bar' };
      const mapStateToParams = sinon.stub().returns(1);

      const store = makeStore();

      const Wrapped = resolver({
        1: () => Promise.resolve(1)
      }, mapStateToParams)(Debug);

      const component = (
        <Provider store={store}>
          <Wrapped params={params} />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      mapStateToParams.calledTwice.should.be.true;

      const lastCall = mapStateToParams.args[1];

      lastCall.should.have.length(2);
      lastCall[0].should.be.equal(store.getState());
      lastCall[1].should.be.deep.equal({ params });
    });

    it('should restart when params changed', done => {
      const store = createStore(combineReducers({
        resolver: reducer,
        params: (state = { id: 1 }, action = {}) => {
          const { type } = action;

          switch (type) {
            case 'params/update':
              return { id: state.id + 1 };
            default: return state;
          }
        }
      }), { resolver: {}, params: {} });
      const stub1 = sinon.stub().returns(Promise.resolve(1));
      const stub2 = sinon.stub().returns(Promise.resolve(2));
      const wait = delay(10);

      const Wrapped = resolver({
        stub1,
        stub2
      })(Debug);

      class Wrapper extends Component {
        static propTypes = {
          dispatch: PropTypes.func,
          params: PropTypes.any
        };

        componentDidMount() {
          wait.then(() => {
            this.props.dispatch({
              type: 'params/update'
            });
          });
        }

        render() {
          const { params } = this.props;
          return <Wrapped params={params} />;
        }
      }

      const SubscribedWrapper = connect(state => ({
        params: state.params
      }))(Wrapper);

      const component = (
        <Provider store={store}>
          <SubscribedWrapper />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      wait().then(() => delay(10)).then(() => {
        stub1.calledTwice.should.be.true;
        stub2.calledTwice.should.be.true;
        done();
      });
    });
  });

  describe('Impure rendering', () => {
    it('should always rerender once pure:false was specified', () => {
      const pending = sinon.stub().returns(null);
      const Wrapped = resolver({
        1: () => delay(10, 1),
        2: () => delay(20, 2),
        3: () => delay(30, 3)
      })(() => null, undefined, pending);

      const store = makeStore();

      const component = (
        <Provider store={store}>
          <Wrapped params={{}} />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      return delay(40).then(() => {
        pending.calledOnce.should.be.true;
      });
    });
    it('should always rerender if pure:false was specified', () => {
      const pending = sinon.stub().returns(null);
      const Wrapped = resolver({
        1: () => delay(10, 1),
        2: () => delay(20, 2),
        3: () => delay(30, 3)
      }, undefined, undefined, {
        pure: false
      })(() => null, undefined, pending);

      const store = makeStore();

      const component = (
        <Provider store={store}>
          <Wrapped params={{}} />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      return delay(40).then(() => {
        // initial rendering + 1 on each resolve
        pending.args.should.have.length(3 + 1);
      });
    });
  });

  describe('Statics hoist', () => {
    it('should hoist non react statics', () => {
      const cmp = () => null;
      cmp.testStaticHoisting = {};

      const Wrapped = resolver({})(cmp);

      Wrapped.should.have.property('testStaticHoisting', cmp.testStaticHoisting);
    });

    it('should NOT hoist statics if options tells no to do so', () => {
      const cmp = () => null;
      cmp.testStaticHoisting = {};

      const Wrapped = resolver({}, undefined, undefined, {
        hoistNonReactStatics: false
      })(cmp);

      Wrapped.should.not.have.property('testStaticHoisting');
    });
  });

  describe('Non Promise values', () => {
    it('should allow to return non-promise values', () => {
      const cmp = sinon.stub().returns(null);

      const Wrapped = resolver({
        1: () => 1,
        2: () => ({ 2: 2 }),
        3: () => null
      })(cmp);
      const store = makeStore();

      const component = (
        <Provider store={store}>
          <Wrapped params={{}} />
        </Provider>
      );

      TestUtils.renderIntoDocument(component);

      cmp.calledOnce.should.be.true;
      cmp.args[0][0].should.be.deep.equal({ 1: 1, 2: { 2: 2 }, 3: null });
    });
  });

  describe('Invariants', () => {
    it('should throw when called w/o mapParamsToPromises', () => {
      expect(() => resolver()).to.throw(/mapParamsToPromises/);
    });

    it('should throw when mapParamsToPromises is not object', () => {
      expect(() => resolver('test')).to.throw(/mapParamsToPromises/);
    });

    it('should throw when mapParamsToPromises is null', () => {
      expect(() => resolver(null)).to.throw(/mapParamsToPromises/);
    });

    it('should throw when custom mapStateToParams is not a function', () => {
      expect(() => resolver({}, {})).to.throw(/mapStateToParams/);
    });

    it('should throw when custom mapRouteToParams is not a function', () => {
      expect(() => resolver({}, undefined, {})).to.throw(/mapRouteToParams/);
    });

    it('should throw when options is not an object', () => {
      expect(() => resolver({}, undefined, undefined, 5)).to.throw(/options/);
    });
  });

  describe('Resolve on Server', () => {
    it('should add static resolveOnServer function', () => {
      const Wrapped = resolver({})(() => null);

      Wrapped.should.have.property('resolveOnServer')
        .that.is.a('function');
    });

    it('should throw when called w/o dispatch', () => {
      const Wrapped = resolver({})(() => null);

      expect(() => Wrapped.resolveOnServer({}, {})).to.throw(/dispatch/);
    });

    it('should allow to pass custom mapRouteToParams', () => {
      const mapRouteToParams = sinon.stub().returns({ id: 1 });
      const stub = sinon.stub().returns(Promise.resolve(2));

      const Wrapped = resolver({ stub }, undefined, mapRouteToParams)(() => null);

      const state = {};
      const routeProps = {};

      Wrapped.resolveOnServer(state, routeProps, () => null);

      mapRouteToParams.calledOnce.should.be.true;
      mapRouteToParams.args[0][0].should.be.equal(state);
      mapRouteToParams.args[0][1].should.be.equal(routeProps);
    });

    it('should return a promise', () => {
      const Wrapped = resolver({
        1: () => Promise.resolve(1),
        2: () => Promise.resolve(2)
      })(() => null);

      return Wrapped.resolveOnServer({}, {}, () => null).then(([res1, res2]) => {
        res1.should.be.equal(1);
        res2.should.be.equal(2);
      });
    });
  });
});
