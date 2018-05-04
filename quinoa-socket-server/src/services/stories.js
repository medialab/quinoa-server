import {v4 as uuid} from 'uuid';
import {outputFile, outputJson, readJson, remove, ensureFile} from 'fs-extra';
import {resolve} from 'path';
import authManager from './auth';
import {store} from '../server';

const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const adapter = new FileAsync('./data/storyList.json');

const storiesPath = resolve(`${__dirname}/../../data/stories`);
const dataPath = resolve(`${__dirname}/../../data`);

const updateStoryList = (story) =>
  new Promise((resolve, reject) => {
    const storyListPath = dataPath + '/storyList.json';
    readJson(storyListPath)
    .then((stories) => {
      if (stories[story.id]) reject(new Error('story is exist'));
      else {
        stories[story.id] = {
          id: story.id,
        };
        return outputJson(storyListPath, stories);
      }
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
  })

const getStory = (id) =>
  new Promise ((resolve, reject) => {
    const addr = storiesPath + '/' + id + '/' + id + '.json';
    return readJson(addr)
          .then((res) => resolve(res))
          .catch((err) => reject(err))
  })

const getActiveStory = (id, userId, socket) =>
  new Promise ((resolve, reject) => {
    const {stories} = store.getState();
    console.log(stories);
    if (stories[id]) {
      store.dispatch({
        type: 'ENTER_STORY',
        payload: {
          storyId: id,
          userId
        }
      });
      socket.join(id);
      socket.to(id).emit({
        type: 'ENTER_STORY_BROADCAST',
        payload: {
          storyId: id,
          userId
        }
      });
      return resolve(stories[id]);
    }
    else {
      const addr = storiesPath + '/' + id + '/' + id + '.json';
      return readJson(addr)
            .then((res) => {
              store.dispatch({
                type: 'ACTIVATE_STORY',
                payload: res
              });
              store.dispatch({
                type: 'ENTER_STORY',
                payload: {
                  storyId: id,
                  userId
                }
              });
              socket.join(id);
              socket.to(id).emit('action', {
                type: 'ENTER_STORY_BROADCAST',
                payload: {
                  storyId: id,
                  userId
                }
              });
              return resolve(res);
            })
            .catch((err) => reject(err))
    }
  })

const deleteStory = (id) =>
  new Promise ((resolve, reject) => {
    const storyPath = storiesPath + '/' + id;
    return remove(storyPath)
           .then(deleteStoryList(id))
           .then(() => {
              store.dispatch({type: 'DELETE_STORY', payload: {id}});
              return resolve()
            })
           .catch(err => reject(err))
  });

module.exports = {
  createStory,
  getStories,
  getStory,
  getActiveStory,
  deleteStory,
}