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
const parallel = require('async/parallel');
const series = require('async/series');
const asyncMap = require('async/mapSeries');
const uuid = require('uuid/v4');

const storiesPath = path.resolve(__dirname + '/../../data/stories/');
const resourceManager = require('../resourcesManager');
const authManager = require('../authManager');
const bundleStory = require('../storyBundler');

/**
 * Fetches and returns all stories stored locally
 * @param {function} filterFunction - (optional) function to use if stories are supposed to be filtered by content
 * @param {function} callback - callbacks an error and an object with keys as stories id/filenamebase and values as json restories of the stories
 */
function getStories (filterFunction, callback) {
  waterfall([
    // list files
    (listCallback) => {
      fs.readdir(storiesPath, listCallback);
    },
    // read all files contents
    (filesList, parsedCallback) =>
      asyncMap(
        filesList
        // .filter(fileName => fileName.indexOf('.json') === fileName.length - 5)
      , (fileName, fileCb) => {
        const addr = storiesPath + '/' + fileName + '/' + fileName + '.json';
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
  const addr = storiesPath + '/' + id + '/' + id + '.json';
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
 * Fetches and returns the published (all-in-one) story
 * @param {function} callback - callbacks an error and the resulting story json restory
 */
function getStoryBundle (id, callback) {
  const storyAddr = storiesPath + '/' + id + '/' + id + '.json';
  const resourcesPath = storiesPath + '/' + id + '/resources';
  waterfall([
    // list files
    (listCallback) => {
      fs.readdir(resourcesPath, listCallback);
    },
    // read all files contents
    (filesList, parsedCallback) =>
      asyncMap(
        filesList,
        (fileName, readCallback) => {
          const resourceAddr = resourcesPath + '/' + fileName;
          const ext = fileName.split('.')[1];
          const resourceId = fileName.split('.')[0];
          if (ext === 'json')
            fs.readFile(resourceAddr, 'utf-8', (err, content) => {
              const resp = {
                id: resourceId,
                data: {
                  json: JSON.parse(content)
                }
              };
              return readCallback(err, resp);
            });
          else
            fs.readFile(resourceAddr, (err, content) => {
              const encodeString = new Buffer(content, 'binary').toString('base64');
              const resp = {
                id: resourceId,
                data: {
                  base64: "data:image/" + ext + ";base64," + encodeString
                }
              };
              readCallback(err, resp);
            })
        }, parsedCallback),
    (resources, readCallback) =>
      fs.readFile(storyAddr, 'utf-8', (err, content) => {
        const bundle = {
          story: JSON.parse(content),
          resources
        }
        return readCallback(err, bundle);
      }),
    (bundle, bundleCallback) => {
      const reducedResources = bundle.resources.reduce((result, item) => ({
        ...result,
        [item.id]: item
      }), {});
      const newResources = {};
      Object.keys(bundle.story.resources)
        .map(key => bundle.story.resources[key])
        .forEach(resource => {
          if (reducedResources[resource.metadata.id]) {
            newResources[resource.metadata.id] = {
              ...resource,
              data: reducedResources[resource.metadata.id].data
            };
          }
        });
      const newStory = {
        ...bundle.story,
        resources: {
          ...bundle.story.resources,
          ...newResources
        }
      }
      return bundleCallback(null, newStory);
    }
  ], callback);
}

/**
 * Creates a new story
 * @param {function} callback - callbacks an error
 */
function createStory (data, callback) {
  const {story, password} = data;
  const id = uuid();
  const storyPath = storiesPath + '/' + id;
  fsExtra.mkdirsSync(storyPath);

  // create resource folder when initialize
  const resourcesPath = storyPath + '/resources';
  fsExtra.mkdirsSync(resourcesPath);

  const resourcesList = Object.keys(story.resources)
                              .map(key => story.resources[key])
                              .filter(resource => {
                                const type = resource.metadata.type;
                                return (type === 'image' || type === 'data-presentation' || type === 'table');
                              })

  series([
    (credentialCb) => {
      authManager.createCredential(id, password, credentialCb);
    },
    (resourcesCb) => {
      asyncMap(
        resourcesList,
        (resource, resourceCb) => {
          resourceManager.createResource(id, resource, resourceCb);
        }, resourcesCb);
    },
    (storyCb) => {
      const newResources = {};
      resourcesList.forEach(resource => {
        newResources[resource.metadata.id] = {metadata: story.resources[resource.metadata.id].metadata};
      });
      const newStory = {
        ...story,
        id,
        resources: {
          ...story.resources,
          ...newResources
        }
      }
      const addr = storyPath + '/' + id + '.json';
      const contents = JSON.stringify(newStory);
      fs.writeFile(addr, contents, (err) => {
        if (err) storyCb(err);
        else storyCb(null, newStory);
      });
    }
  ], (err, result) => {
    if (err) callback(err);
    else callback(null, {
      token: result[0],
      story: result[2]
    })
  })
}

/**
 * Updates a specific story
 * @param {function} callback - callbacks an error
 */
function updateStory (id, story, callback) {
  const addr = storiesPath + '/' + id + '/' + id + '.json';
  const contents = typeof story === 'string' ? story : JSON.stringify(story);
  fs.writeFile(addr, contents, callback);
}

/**
 * publish full story on server
 * @param {function} callback - callbacks an error
 */
function publishStory (id, story, callback) {
  parallel([
    (storyCb) => {
      const jsonAddr = storiesPath + '/' + id + '/' + id + '_bundle.json';
      const contents = typeof story === 'string' ? story : JSON.stringify(story);
      fs.writeFile(jsonAddr, contents, storyCb);
    },
    (storyHtmlCb) => {
      const htmlAddr = storiesPath + '/' + id + '/index.html';
      const bundle = bundleStory(story);
      fs.writeFile(htmlAddr, bundle, storyHtmlCb);
    }
  ], callback);
}

/**
 * Deletes a specific story
 * @param {function} callback - callbacks an error
 */
function deleteStory (id, callback) {
  series([
    (credentialCb) => {
      authManager.deleteCredential(id, credentialCb)
    },
    (storyCb) => {
      const storyPath = storiesPath + '/' + id;
      fsExtra.remove(storyPath, storyCb);
    }
  ], callback)
}
/**
 * The module exports a map of crud functions
 */
module.exports = {
  getStories,
  getStory,
  getStoryBundle,
  createStory,
  updateStory,
  publishStory,
  deleteStory
};
