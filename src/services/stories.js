import {v4 as uuid} from 'uuid';
import {outputFile, outputJson, readJson, remove, ensureFile} from 'fs-extra';
import {resolve} from 'path';
import authManager from './auth';
import resourceManager from './resources';
import config from 'config';
import store from '../store/configureStore';
import {validateStory} from '../validators/schemaValidator';
import validateStoryEntity from '../validators/entityValidator';

import selectors from '../ducks';

const dataPath = config.get('dataFolder');
const storiesPath = resolve(`${dataPath}/stories`);

const updateStoryList = (story) =>
  new Promise((resolve, reject) => {
    const storyListPath = dataPath + '/storyList.json';
    readJson(storyListPath)
    .then((stories) => {
      stories[story.id] = {
        id: story.id,
        metadata: story.metadata,
        lastUpdateAt: story.lastUpdateAt
      };
      return outputJson(storyListPath, stories);
    })
    .then(() => resolve())
    .catch((err) => reject(err))
  });

const deleteStoryList = (id) =>
  new Promise((resolve, reject) => {
    const storyListPath = dataPath + '/storyList.json';
    readJson(storyListPath)
    .then((stories) => {
      if (!stories[id]) reject(new Error('story is not exist'));
      else {
        delete stories[id];
        return outputJson(storyListPath, stories);
      }
    })
    .then(() => resolve())
    .catch((err) => reject(err))
  });

const trimStory = (story) =>
  new Promise ((resolve, reject) => {
    const resourcesUploaded = Object.keys(story.resources)
                              .map(id => story.resources[id])
                              .filter(resource => resource.metadata.type === 'image' || resource.metadata.type === 'table');
    const resourcesPromise = resourcesUploaded
                              .map(resource => resourceManager.createResource(story.id, resource.id,resource));
    return Promise.all(resourcesPromise)
            .then((resources) => {
              const resourcesMap =
                resources.reduce((result, item) => (
                  {...result,[item.id]: item}), {});
              const newStory = {
                ...story,
                resources: {
                  ...story.resources,
                  ...resourcesMap
                }
              };
              resolve(newStory);
            })
            .catch((err) => reject(err))

  });

const createStory = (story, password) =>
  new Promise ((resolve, reject) => {
    const id = uuid();
    const storyPath = storiesPath + '/' + id;
    const addr = storyPath + '/' + id + '.json';
    story = {...story, id};
    trimStory(story)
    .then((newStory) => {
      outputJson(addr, newStory)
      .then(() => updateStoryList(newStory))
      .then(() => authManager.register(id, password))
      .then(token => resolve({story: newStory, token}))
      .catch(err => reject(err));
    })
  });

const updateStory = (story) =>
  new Promise ((resolve, reject) => {
    const storyPath = storiesPath + '/' + story.id;
    const addr = storyPath + '/' + id + '.json';
    trimStory(story)
    .then((newStory) => {
      outputJson(addr, newStory)
      .then(() => updateStoryList(newStory))
      .then(() => resolve(newStory))
      .catch(err => reject(err));
    })
  });

const getStories = () =>
  new Promise ((resolve, reject) => {
    const storyListPath = dataPath + '/storyList.json';
    return ensureFile(storyListPath)
          .then(() => readJson(storyListPath))
          .then((res) => resolve(res))
          .catch(() => {
            outputJson(storyListPath, {})
          })
          .catch((err) => reject(err));
  });

const getStory = (id) =>
  new Promise ((resolve, reject) => {
    const addr = storiesPath + '/' + id + '/' + id + '.json';
    return readJson(addr)
          .then((res) => resolve(res))
          .catch((err) => reject(err))
  });

const getStoryBundle = (storyId) =>
  new Promise ((resolve, reject) => {
    getStory(storyId)
    .then((story) => {
      const resourcesUploaded = Object.keys(story.resources)
                                .map(id => story.resources[id])
                                .filter(resource => resource.metadata.type === 'image' || resource.metadata.type === 'table');
      const resourcesPromise = resourcesUploaded
                                .map(resource => resourceManager.getResource(storyId, resource));
      return Promise.all(resourcesPromise)
            .then((resources) => {
              const resourcesMap =
                resources.reduce((result, item) => (
                  {...result,[item.id]: item}), {});
              const newStory = {
                ...story,
                resources: {
                  ...story.resources,
                  ...resourcesMap
                }
              };
              resolve(newStory);
            })
            .catch((err) => reject(err))
    })
    .catch((err) => reject(err))
  });

const writeStory = (story) =>
  new Promise ((resolve, reject) => {
    const {id} = story;
    getStory(id)
    .then((validStory) => {
      let validation = validateStory(story);
      if (!validation.valid) {
        store.dispatch({
          type: 'ACTIVATE_STORY',
          payload: validStory
        });
        return reject({id, success: false, errors: validation.errors})
      }
      validation = validateStoryEntity(story);
      if (!validation.valid) {
        store.dispatch({
          type: 'ACTIVATE_STORY',
          payload: validStory
        });
        return reject({id, success: false, errors: validation.errors})
      }
      const addr = storiesPath + '/' + id + '/' + id + '.json';
      return updateStoryList(story)
            .then(() => outputJson(addr, story))
            .then((res) => resolve({id, success: true}))
            .catch((err) => reject({id, success: false}))
    })
  });

const writeStories = (stories) =>
  new Promise((resolve, reject) => {
    const storiesPromise = stories.map(story => writeStory(story));
    Promise.all(storiesPromise.map(p => p.catch(e => e)))
    .then((res) => resolve(res.filter(result => !result.success)))
    .catch((err) => reject(err));
    // if(storiesUpdated.length > 0) {
    //   let errors = [];

    //   storiesUpdated.reduce((curr, next) => {
    //     return curr.then(() =>
    //       writeStory(next)
    //       .then((res) => {
    //         if(res && !res.success) errors.push(res);
    //       })
    //     );
    //   }, Promise.resolve())
    //   .then(() => resolve(errors))
    //   .catch((err) => reject(err));
    // }
  });

const deleteStory = (id) =>
  new Promise ((resolve, reject) => {
    const storyPath = storiesPath + '/' + id;
    return remove(storyPath)
           .then(deleteStoryList(id))
           .then(() => resolve())
           .catch(err => reject(err))
  });


module.exports = {
  createStory,
  updateStory,
  getStories,
  getStory,
  getStoryBundle,
  writeStory,
  writeStories,
  deleteStory,
}