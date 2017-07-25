/**
 * Unit tests for the presentationManager service
 */
const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const uuid = require('uuid/v4');
var mock = require('mock-fs');

const lib = require('../services/presentationsManager');

const presentationsPath = path.resolve(__dirname + '/../data/presentations/');
const mockPresentation = require('./mocks/simple-map-presentation.json');
const mockId = uuid();
const mockContents = {
  [presentationsPath + '/' + mockId + '.json']: JSON.stringify(mockPresentation)
};

describe('presentationsManager', () => {
  describe('getPresentations', () => {
    it('should callback presentation contents as an object when asked simple get', (done) => {
      mock(mockContents);
      lib.getPresentations(null, (err, results) => {
        expect(results).to.be.an('object');
        mock.restore();
        done();
      });
    });
    // todo : filter use case
  });

  describe('getPresentation', () => {
    it('should callback a presentation as a json representation when asked', (done) => {
      mock(mockContents);
      lib.getPresentation(mockId, (err, results) => {
        expect(results).to.be.an('object');
        mock.restore();
        done();
      });
    });
  });

  describe('createPresentation', () => {
    it('should successfully create a presentation', (done) => {
      mock(mockContents);
      lib.createPresentation(mockPresentation, (err, results) => {
        expect(err).to.be.null;
        mock.restore();
        done();
      });
    });
  });

  describe('updatePresentation', () => {
    const modified = Object.assign({}, mockPresentation);
    modified.metadata.title = "modified title";
    it('should successfully updated a presentation', (done) => {
      mock(mockContents);
      lib.updatePresentation(mockId, mockPresentation, (err, results) => {
        expect(err).to.be.null;
        mock.restore();
        done();
      });
    });
  });

  describe('deletePresentation', () => {
    it('should successfully delete a presentation', (done) => {
      mock(mockContents);
      lib.deletePresentation(mockId, (err, results) => {
        expect(err).to.be.null;
        lib.getPresentations(null, (getErrors, presentations) => {
          expect(Object.keys(presentations)).to.have.length(0);
          mock.restore();
          return done();
        });
      });
    });
  });
});

