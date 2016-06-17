import resolver, { resolveOnServer } from './resolver';

describe('Resolver', () => {
  it('should be a function', () => {
    expect(resolver).to.be.a('function');
  });

  describe('resolveOnServer', () => {
    it('should be a function', () => {
      expect(resolveOnServer).to.be.a('function');
    });
  });
});
