const chai = require('chai');
const expect = chai.expect;

const bundlePresentation = require('../services/presentationBundler');

const mockPresentation = require('./mocks/simple-map-presentation.json');

describe('presentationBundler', () => {
  it('should return a string', (done) => {
    const result = bundlePresentation(mockPresentation);
    expect(result).to.be.a('string');
    done();
  });
});