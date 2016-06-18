import flatten from './flatten';

describe('Component flatten', () => {
  it('should be a function', () => {
    expect(flatten).to.be.a('function');
  });

  it('should wrap single component with array', () => {
    const component = () => null;

    flatten(component).should.be.an('array')
      .that.is.deep.equal([component]);
  });

  it('should flatten objects to array', () => {
    const component1 = () => null;
    const component2 = () => null;
    const component3 = () => null;

    flatten([component1, { component2, component3 }])
      .should.be.deep.equal([component1, component2, component3]);
  });
});
