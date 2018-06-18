import {v4 as uuid} from 'uuid';
import {outputFile, outputJson, readJson, remove, ensureFile} from 'fs-extra';
import {resolve} from 'path';
import authManager from './auth';
import config from 'config';
import store from '../store/configureStore';

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

const createStory = (story, password) =>
  new Promise ((resolve, reject) => {
    const id = uuid();
    const storyPath = storiesPath + '/' + id;
    const addr = storyPath + '/' + id + '.json';
    story = {...story, id};
    return outputJson(addr, story)
           .then(() => updateStoryList(story))
           .then(() => authManager.register(id, password))
           .then(token => resolve({story, token}))
           .catch(err => reject(err))
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

const writeStory = (story) =>
  new Promise ((resolve, reject) => {
    const {id} = story;
    const addr = storiesPath + '/' + id + '/' + id + '.json';
    return updateStoryList(story)
          .then(() => outputJson(addr, story))
          .then((res) => resolve({id, success: true}))
          .catch((err) => reject({id, success: false}))
  });

const writeStories = (timeAfter) =>
  new Promise((resolve, reject) => {
    const stories = selectors(store.getState()).storiesMap;
    const storiesUpdated = Object.keys(stories)
                                 .map(id => stories[id])
                                 .filter(story => story.lastUpdateAt >= timeAfter);
    const storiesPromise = storiesUpdated.map(story => writeStory(story));
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
  getStories,
  getStory,
  writeStory,
  writeStories,
  deleteStory,
}