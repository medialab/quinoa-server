import {v4 as uuid} from 'uuid';
import {outputFile, outputJson, readJson, remove, ensureFile, readFile, statSync} from 'fs-extra';
import getSize from 'get-folder-size';
import {resolve} from 'path';

import authManager from './auth';
import store from '../store/configureStore';
import config from 'config';

const dataPath = config.get('dataFolder');
const storiesPath = resolve(`${dataPath}/stories`);

const maxFolderSize = config.get('maxFolderSize');

const createResource = (storyId, id, resource) =>
  new Promise ((resolve, reject) => {
    const {type, ext} = resource.metadata;
    let newResource;
    const resourceFolderPath = `${storiesPath}/${storyId}/resources/`;
    let addr = `${storiesPath}/${storyId}/resources/${id}/${id}.json`;
    if (type === 'image') {
      const data = JSON.stringify(resource.data.base64).replace(/['"]+/g, '');
      // const ext = data.substring("data:image/".length, data.indexOf(";base64"));
      const dataString = data.replace(/^data:image\/\w+;base64,/, "");
      const buff = new Buffer(dataString, 'base64');
      addr = `${storiesPath}/${storyId}/resources/${id}/${id}.${ext}`;
      newResource = {
        ...resource,
        data: {
          filePath: `/${storyId}/resources/${id}/${id}.${ext}`
        }
      }
      getSize(resourceFolderPath, (err, folderSize) => {
        if (err) return reject(err);
        if ((folderSize + buff.byteLength) > maxFolderSize) {
          return reject(new Error('extend maximum resources size'));
        }
        return outputFile(addr, buff)
                .then(() => resolve(newResource))
                .catch((err) => reject(err))
      });
    }
    else {
      newResource = {
        ...resource,
        data: {
          filePath: `/${storyId}/resources/${id}/${id}.json`
        },
        createdAt: new Date().getTime(),
        lastUpdateAt: new Date().getTime()
      }
      getSize(resourceFolderPath, (err, folderSize) => {
        if (err) return reject(err);
        if ((folderSize + JSON.stringify(resource.data.json).length) > maxFolderSize) {
          return reject(new Error('extend maximum resources size'));
        }
        return outputJson(addr, resource.data.json)
             .then(() => resolve(newResource))
             .catch(err => reject(err))
      })
    }
  });

const getResource = (storyId, resource) =>
  new Promise ((resolve, reject) => {
    if (resource.metadata.type === 'image') {
      const {ext} = resource.metadata;
      const filePath = `${storiesPath}/${storyId}/resources/${resource.id}/${resource.id}.${ext}`;
      return readFile(filePath)
      .then(result => {
        const encodeString = new Buffer(result, 'binary').toString('base64');
        return resolve({...resource, data: {base64: "data:image/" + ext + ";base64," + encodeString}});
      })
      .catch((err) => reject(err));
    }
    else {
      const filePath = `${storiesPath}/${storyId}/resources/${resource.id}/${resource.id}.json`;
      return readJson(filePath)
      .then(result => resolve({...resource, data: {json: result}}))
      .catch((err) => reject(err));
    }
  });

const deleteResource = (storyId, id) =>
  new Promise ((resolve, reject) => {
    const resourcePath = `${storiesPath}/${storyId}/resources/${id}`;
    return remove(resourcePath)
           .then(() => resolve())
           .catch(err => reject(err))
  });


module.exports = {
  createResource,
  deleteResource,
  getResource,
}