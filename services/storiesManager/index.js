/**
 * This module handle Create-Read-Update-Delete operations
 * on locally stored stories
 * ===========
 * @module quinoa-server/services/storiesManager
 */
const fs = require('fs');
const path = require('path');
const waterfall = require('async/waterfall');
const asyncMap = require('async/mapSeries');
const uuid = require('uuid/v4');

const storiesPath = path.resolve(__dirname + '/../../data/stories/');

/**
 * Fetches and returns all stories stored locally
 * @param {function} filterFunction - (optional) function to use if stories are supposed to be filtered by content
 * @param {function} callback - callbacks an error and an object with keys as stories id/filenamebase and values as json restories of the stories
 */
function getStories (filterFunction, callback) {
  waterfall([
    // list files
    (listCallback) =>
      fs.readdir(storiesPath, listCallback),
    // read all files contents
    (filesList, parsedCallback) =>
      asyncMap(
        filesList
        .filter(fileName => fileName.indexOf('.json') === fileName.length - 5)
      , (fileName, fileCb) => {
        const addr = storiesPath + '/' + fileName;
        console.log(fileName);
        fs.readFile(addr, 'utf-8', (fileErr, content) => {
          if (fileErr) {
            return fileCb(fileErr);
          } else {
            const resp = {
              id: fileName.split('.')[0],
              content: content.toString('utf8')
            };
            return fileCb(null, resp);
          }
        })
      }, (parseError, filesContents) => {
        if (parseError) {
          return parsedCallback(parseError);
        } else {
          return parsedCallback(null, filesContents);
        }
      }),
    // parse files contents to json
    (parsedFiles, convertCallback) => {
      try {
        const converted = parsedFiles
        .filter(file => typeof file.id === 'string')
        .map((fileDesc) => {
          return {
            id: fileDesc.id,
            content: JSON.parse(fileDesc.content.trim())
          }
        });
        return convertCallback(null, converted);
      } catch (convertError) {
        console.log('convert error', convertError);
        return convertCallback(convertError);
      }
    },
    // filter if asked
    (convertedFiles, filterCallback) => {
      if (filterFunction && typeof filterFunction === 'function') {
        try {
          const filtered = convertedFiles.filter(fileDesc => {
            return filterFunction(fileDesc.content);
          });
          return filterCallback(null, filtered);
        } catch (filterError) {
          return filterCallback(filterError);
        }
      } else {
        return filterCallback(null, convertedFiles);
      }
    },
    // reduce to an object with stories ids as keys
    (filteredFiles, reducedCallback) => {
      const reduced = filteredFiles.reduce((obj, fileDesc) => {
        obj[fileDesc.id] = fileDesc.content;
        return obj;
      }, {});
      return callback(null, reduced);
    }
  ], callback);
}

/**
 * Fetches and returns a specific story
 * @param {function} callback - callbacks an error and the resulting story json restory
 */
function getStory (id, callback) {
  const addr = storiesPath + '/' + id + '.json';
  waterfall([
    (readCallback) =>
      fs.readFile(addr, 'utf-8', readCallback),
    (strContent, convertCallback) => {
      console.log('str')
      let content;
      try {
        content = JSON.parse(strContent.trim());
      }
      catch (error) {
        console.log(error)
        return convertCallback(error)
      }
      console.log('str 2')
      return convertCallback(null, content);
    }
  ], callback);
}

/**
 * Creates a new story
 * @param {function} callback - callbacks an error
 */
function createStory (story, callback) {
  const id = story.id || uuid();
  const addr = storiesPath + '/' + id + '.json';
  const contents = typeof story === 'string' ? story : JSON.stringify(story);
  fs.writeFile(addr, contents, callback);
}

/**
 * Updates a specific story
 * @param {function} callback - callbacks an error
 */
function updateStory (id, story, callback) {
  const addr = storiesPath + '/' + id + '.json';
  const contents = typeof story === 'string' ? story : JSON.stringify(story);
  fs.writeFile(addr, contents, callback);
}

/**
 * Deletes a specific story
 * @param {function} callback - callbacks an error
 */
function deleteStory (id, callback) {
  const addr = storiesPath + '/' + id + '.json';
  return fs.unlink(addr, callback);
}
/**
 * The module exports a map of crud functions
 */
module.exports = {
  getStories: getStories,
  getStory: getStory,
  createStory: createStory,
  updateStory: updateStory,
  deleteStory: deleteStory
}