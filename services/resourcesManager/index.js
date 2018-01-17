/**
 * This module handle Create-Read-Update-Delete operations
 * on locally stored stories
 * ===========
 * @module quinoa-server/services/storiesManager
 */
const fs = require('fs');
const fsExtra = require('fs-extra');

const path = require('path');
const waterfall = require('async/waterfall');
const asyncMap = require('async/mapSeries');
const uuid = require('uuid/v4');

const dirPath = path.resolve(__dirname + '/../../data/stories/');

/**
 * Fetches and returns all resources for one story
 * @param {function} filterFunction - (optional) function to use if stories are supposed to be filtered by content
 * @param {function} callback - callbacks an error and an object with keys as stories id/filenamebase and values as json restories of the stories
 */
function getResources (storyId, callback) {
  const resourcesPath = dirPath + '/' + storyId + '/resources';
  waterfall([
    // list files
    (listCallback) =>
      fs.readdir(resourcesPath, listCallback),
    // read all files contents
    (filesList, parsedCallback) =>
      asyncMap(
        filesList
        .filter(fileName => fileName.indexOf('.json') === fileName.length - 5)
      , (fileName, fileCb) => {
        const addr = resourcesPath + '/' + fileName;
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
        });
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
          };
        });
        return convertCallback(null, converted);
      } catch (convertError) {
        console.log('convert error', convertError);
        return convertCallback(convertError);
      }
    },
    // reduce to an object with stories ids as keys
    (files, reducedCallback) => {
      const reduced = files.reduce((obj, fileDesc) => {
        obj[fileDesc.id] = fileDesc.content;
        return obj;
      }, {});
      return callback(null, reduced);
    }
  ], callback);
}

/**
 * Fetches and returns a specific resource
 * @param {function} callback - callbacks an error and the resulting story json restory
 */
function getResource (storyId, id, callback) {
  const resourcesPath = dirPath + '/' + storyId + '/resources';
  const addr = resourcesPath + '/' + id + '.json';
  waterfall([
    (readCallback) =>
      fs.readFile(addr, 'utf-8', readCallback),
    (strContent, convertCallback) => {
      let content;
      try {
        content = JSON.parse(strContent.trim());
      }
      catch (error) {
        return convertCallback(error);
      }
      return convertCallback(null, content);
    }
  ], callback);
}

/**
 * Creates a new resource
 * @param {function} callback - callbacks an error
 */
function createResource (storyId, resource, callback) {
  const id = resource.id || uuid();
  const resourcesPath = dirPath + '/' + storyId + '/resources';
  fsExtra.mkdirsSync(resourcesPath);
  const addr = resourcesPath + '/' + id + '.json';
  const contents = typeof resource === 'string' ? resource : JSON.stringify(resource);
  fs.writeFile(addr, contents, callback);
}

/**
 * Updates a specific resource
 * @param {function} callback - callbacks an error
 */
function updateResource (storyId, id, resource, callback) {
  const resourcesPath = dirPath + '/' + storyId + '/resources';
  fsExtra.mkdirsSync(resourcesPath);
  const addr = resourcesPath + '/' + id + '.json';
  const contents = typeof resource === 'string' ? resource : JSON.stringify(resource);
  fs.writeFile(addr, contents, callback);
}

/**
 * Deletes a specific resource
 * @param {function} callback - callbacks an error
 */
function deleteResource (storyId, id, callback) {
  const resourcesPath = dirPath + '/' + storyId + '/resources';
  const addr = resourcesPath + '/' + id + '.json';
  return fs.unlink(addr, callback);
}

/**
 * Deletes resource folder for one story
 * @param {function} callback - callbacks an error
 */
function deleteResourceCollection (storyId, callback) {
  const resourcesPath = dirPath + '/' + storyId + '/resources';
  return fsExtra.remove(resourcesPath, callback);
}

/**
 * The module exports a map of crud functions
 */
module.exports = {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  deleteResourceCollection
};
