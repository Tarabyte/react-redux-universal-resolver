import latest from './latest';

describe('Latest Utils', () => {
  it('should be a function', () => {
    expect(latest).to.be.a('function');
  });

  it('should return a function', () => {
    latest().should.be.a('function');
  });

  it('should call inner function', () => {
    const stub = sinon.stub();

    const framed = latest();

    const framedStub = framed(stub);
    const arg1 = {
      arg1: 1
    };
    const arg2 = {
      arg2: 2
    };

    framedStub(arg1, arg2);

    stub.calledOnce.should.be.true; // eslint-disable-line no-unused-expressions

    stub.args[0].should.be.deep.equal([arg1, arg2]);
  });

  it('should should not called if frame changed', () => {
    const stub1 = sinon.stub();
    const stub2 = sinon.stub();

    const framed = latest();

    const framedStub1 = framed(stub1);
    const framedStub2 = framed(stub2);

    framedStub1();
    framedStub2();
    framedStub1();

    stub1.called.should.be.false; // eslint-disable-line no-unused-expressions

    stub2.calledOnce.should.be.true; // eslint-disable-line no-unused-expressions
  });
});
