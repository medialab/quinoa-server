const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');

const app = require('../server');
const config = require('../config');

const mockPresentation = require('./mocks/simple-map-presentation.json');

describe('route:render-presentation', () => {
  it('should respond with an html file content', (done) => {
    request(app)
      .post('/render-presentation')
      .send(mockPresentation)
      .expect(200)
      .expect('Content-Type', /html/)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        done();
      });
  });
});