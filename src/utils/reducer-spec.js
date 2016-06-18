import reducer from './reducer';

describe('Reducer Maker', () => {
  it('should be a function', () => {
    expect(reducer).to.be.a('function');
  });

  it('should return a function', () => {
    const partial = reducer({});

    expect(partial).to.be.a('function');
  });

  it('should return reducer', () => {
    expect(reducer({})({})).to.be.a('function');
  });

  describe('Reducer', () => {
    it('should return use default value', () => {
      const defaultValue = {};
      const test = reducer({})(defaultValue);

      expect(test()).to.be.equal(defaultValue);
    });

    it('should return unmodified state when no handlers match', () => {
      const handlers = {
        test: () => ({})
      };
      const state = {};
      const red = reducer(handlers)({});

      expect(red(state)).to.equal(state);
    });

    it('should invoke handler by name', () => {
      const handler = sinon.stub();
      const handlers = {
        handler
      };
      const state = {};
      const action = {
        type: 'handler'
      };

      const red = reducer(handlers)({});

      red(state, action);

      // eslint-disable-next-line no-unused-expressions
      handler.calledOnce.should.be.true;

      handler.args[0].should.be.deep.equal([state, action]);
    });
  });
});
