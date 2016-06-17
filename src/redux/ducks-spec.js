import reducer, {
  KEY,
  RESOLVE_START,
  RESOLVE_RESOLVED,
  RESOLVE_REJECTED,
  start,
  resolve,
  reject
} from './ducks';

describe('Ducks', () => {
  it('should define KEY', () => {
    expect(KEY).to.equal('@@resolve');
  });

  describe('Constants', () => {
    it('should export RESOLVE_START', () => {
      RESOLVE_START.should.be.equal('@@resolve/start');
    });

    it('should export RESOLVE_RESOLVED', () => {
      RESOLVE_RESOLVED.should.be.equal('@@resolve/resolved');
    });

    it('should export RESOLVE_REJECTED', () => {
      RESOLVE_REJECTED.should.be.equal('@@resolve/rejected');
    });
  });

  describe('Action creators', () => {
    it('should create start action', () => {
      const key = 'key';
      const payload = {};

      start('key', payload).should.be.deep.equal({
        type: RESOLVE_START,
        payload: {
          key,
          promise: payload
        }
      });
    });

    it('should create resolved action', () => {
      const key = 'key';
      const result = {};

      resolve(key, result).should.be.deep.equal({
        type: RESOLVE_RESOLVED,
        payload: {
          key,
          result
        }
      });
    });

    it('should create rejected action', () => {
      const key = 'key';
      const error = new Error();

      reject(key, error).should.be.deep.equal({
        type: RESOLVE_REJECTED,
        payload: {
          key, error
        }
      });
    });
  });

  describe('Reducer', () => {
    it('should export reducer as default', () => {
      expect(reducer).to.be.a('function');
    });

    it('should return empty object as default state', () => {
      reducer().should.be.deep.equal({});
    });

    it('should add promise on start', () => {
      const pending = {};
      const key = 'pron';
      [start(key, pending)]
        .reduce(reducer, {})
        .should.be.deep.equal({
          [key]: {
            resolving: true,
            resolved: false,
            rejected: false,
            promise: pending
          }
        });
    });

    it('should change promise to result on resolved', () => {
      const promise = {};
      const key = 'pron';
      const result = {};

      [start(key, promise), resolve(key, result)]
        .reduce(reducer, {})
        .should.be.deep.equal({
          [key]: {
            resolving: false,
            resolved: true,
            rejected: false,
            result
          }
        });
    });

    it('should change promise to error on rejected', () => {
      const promise = {};
      const key = 'smth';
      const error = new Error();

      [start(key, promise), reject(key, error)]
        .reduce(reducer, {})
        .should.be.deep.equal({
          [key]: {
            resolving: false,
            resolved: false,
            rejected: true,
            error
          }
        });
    });
  });
});

