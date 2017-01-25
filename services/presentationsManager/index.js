/**
 * This module handle Create-Read-Update-Delete operations
 * on locally stored presentations
 * @module services/presentationsManager
 */
 const fs = require('fs');
const path = require('path'); 
const waterfall = require('async/waterfall');
const asyncMap = require('async/mapSeries');
const uuid = require('uuid/v4');

const presentationsPath = path.resolve(__dirname + '/../../data/presentations/');

/**
 * Fetches and returns all presentations stored locally
 * @param {function} filterFunction - (optional) function to use if presentations are supposed to be filtered by content
 * @param {function} callback - callbacks an error and an object with keys as presentations id/filenamebase and values as json representations of the presentations
 */
function getPresentations (filterFunction, callback) {
  waterfall([
    // list files
    (listCallback) =>
      fs.readdir(presentationsPath, listCallback),
    // read all files contents
    (filesList, parsedCallback) =>
      asyncMap(filesList, (fileName, fileCb) => {
        const addr = presentationsPath + '/' + fileName;
        fs.readFile(addr, (fileErr, content) => {
          if (fileErr) {
            return fileCb(fileErr);
          } else {
            const resp = {
              id: fileName.split('.')[0],
              content: content
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
        const converted = parsedFiles.map((fileDesc) => {
          return {
            id: fileDesc.id,
            content: JSON.parse(fileDesc.content)
          }
        });
        return convertCallback(null, converted);
      } catch (convertError) {
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
    // reduce to an object with presentations ids as keys
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
 * Fetches and returns a specific presentation
 * @param {function} callback - callbacks an error and the resulting presentation json representation
 */
function getPresentation (id, callback) {
  const addr = presentationsPath + '/' + id + '.json';
  waterfall([
    (readCallback) =>
      fs.readFile(addr, readCallback),
    (strContent, convertCallback) => {
      try{
        return convertCallback(null, JSON.parse(strContent));
      } catch (error) {
        return convertCallback(error);
      }
    }
  ], callback); 
}

/**
 * Creates a new presentation
 * @param {function} callback - callbacks an error
 */
function createPresentation (presentation, callback) {
  const id = uuid();
  const addr = presentationsPath + '/' + id + '.json';
  const contents = typeof presentation === 'string' ? presentation : JSON.stringify(presentation);
  fs.writeFile(addr, contents, callback); 
}

/**
 * Updates a specific presentation
 * @param {function} callback - callbacks an error
 */
function updatePresentation (id, presentation, callback) {
  const addr = presentationsPath + '/' + id + '.json';
  const contents = typeof presentation === 'string' ? presentation : JSON.stringify(presentation);
  fs.writeFile(addr, contents, callback); 
}

/**
 * Deletes a specific presentation
 * @param {function} callback - callbacks an error
 */
function deletePresentation (id, callback) {
  const addr = presentationsPath + '/' + id + '.json';
  return fs.unlink(addr, callback);
}

module.exports = {
  getPresentations: getPresentations,
  getPresentation: getPresentation,
  createPresentation: createPresentation,
  updatePresentation: updatePresentation,
  deletePresentation: deletePresentation
}