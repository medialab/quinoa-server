const chai = require('chai');
const expect = chai.expect;

const bundleStory = require('../services/storyBundler');

const mockStory = require('./mocks/peritext-story.json');

describe('storyBundler', () => {
  it('should return a string', (done) => {
    const result = bundleStory(mockStory);
    expect(result).to.be.a('string');
    done();
  });
});