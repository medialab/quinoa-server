import {v4 as uuid} from 'uuid';
import {outputFile, outputJson, readJson, remove, ensureFile} from 'fs-extra';
import {resolve} from 'path';
import authManager from './auth';
import store from '../store/configureStore';
import config from 'config';

const serverUrl = config.get('serverUri');
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
          url: `${serverUrl}/static/${storyId}/resources/${id}/${id}.${ext}`
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
          url: `${serverUrl}/static/${storyId}/resources/${id}/${id}.json`
        }
      }
      return outputJson(addr, resource.data.json)
             .then(() => resolve(newResource))
             .catch(err => reject(err))
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
}