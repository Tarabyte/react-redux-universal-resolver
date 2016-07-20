/* eslint no-unused-expressions:0*/
import resolveAll from './resolve-all';

describe('Resolve All', () => {
  it('should be a function ', () => {
    expect(resolveAll).to.be.a('function');
  });

  it('should throw when called w/o components', () => {
    expect(() => resolveAll()).to.throw();
  });

  it('should call resolveOnServer on components', () => {
    const stub = sinon.stub().returns(Promise.resolve(1));
    const cmp = () => null;
    cmp.resolveOnServer = stub;

    resolveAll([cmp, cmp]);

    stub.calledTwice.should.be.true;
  });

  it('should filter out components w/o resolveOnServer', () => {
    const stub = sinon.stub().returns(Promise.resolve(1));
    const cmp = () => null;
    cmp.resolveOnServer = stub;

    resolveAll([cmp, () => null, () => null, cmp]);

    stub.calledTwice.should.be.true;
  });

  it('should pass additional argumens', () => {
    const stub = sinon.stub().returns(Promise.resolve(1));
    const cmp = () => null;
    cmp.resolveOnServer = stub;
    const arg1 = {};
    const arg2 = {};

    resolveAll(cmp, arg1, arg2);

    stub.calledOnce.should.be.true;
    stub.args[0][0].should.be.equal(arg1);
    stub.args[0][1].should.be.equal(arg2);
  });

  it('should return a promise', () => {
    const stub1 = sinon.stub().returns(Promise.resolve(1));
    const cmp1 = () => null;
    cmp1.resolveOnServer = stub1;
    const stub2 = sinon.stub().returns(Promise.resolve(2));
    const cmp2 = () => null;
    cmp2.resolveOnServer = stub2;

    return resolveAll([cmp1, cmp2]).then(([res1, res2]) => {
      res1.should.be.equal(1);
      res2.should.be.equal(2);
    });
  });

  it('should filter out null and undefined components in array', () => {
    resolveAll([null, undefined]).should.be.ok;
  });

  it('should filter out null and undefined components in object', () => {
    resolveAll({main: null, aside: undefined}).should.be.ok;
  });
});

