import {v4 as uuid} from 'uuid';
import {outputFile, outputJson, readJson, remove, ensureFile, readFile} from 'fs-extra';
import {resolve} from 'path';
import authManager from './auth';
import store from '../store/configureStore';
import config from 'config';

const dataPath = config.get('dataFolder');
const storiesPath = resolve(`${dataPath}/stories`);

const createResource = (storyId, id, resource) =>
  new Promise ((resolve, reject) => {
    const {type, ext} = resource.metadata;
    let newResource;
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
      return outputFile(addr, buff)
              .then(() => resolve(newResource))
              .catch((err) => reject(err))
    }
    else {
      newResource = {
        ...resource,
        data: {
          filePath: `/${storyId}/resources/${id}/${id}.json`
        }
      }
      return outputJson(addr, resource.data.json)
             .then(() => resolve(newResource))
             .catch(err => reject(err))
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