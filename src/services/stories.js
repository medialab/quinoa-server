import {v4 as uuid} from 'uuid';
import {outputFile, outputJson, readJson, remove, ensureFile} from 'fs-extra';
import {resolve} from 'path';
import authManager from './auth';
import {store} from '../server';
import config from 'config';

const dataPath = config.get('dataFolder');
const storiesPath = resolve(`${dataPath}/stories`);

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
  });

const getStory = (id) =>
  new Promise ((resolve, reject) => {
    const addr = storiesPath + '/' + id + '/' + id + '.json';
    return readJson(addr)
          .then((res) => resolve(res))
          .catch((err) => reject(err))
  });

const getActiveStory = (id, userId, socket) =>
  new Promise ((resolve, reject) => {
    const {stories, connections} = store.getState();
    const {locking} = connections;
    if (stories[id]) {
      store.dispatch({
        type: 'ENTER_STORY',
        payload: {
          storyId: id,
          userId
        }
      });
      socket.emit('action', {
        type: 'ENTER_STORY_INIT',
        payload: {
          storyId: id,
          locks: (locking[id] && locking[id].locks) || {},
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
              socket.emit('action', {
                type: 'ENTER_STORY_INIT',
                payload: {
                  storyId: id,
                  locks: (locking[id] && locking[id].locks) || {},
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

const writeStory = (id) =>
  new Promise ((resolve, reject) => {
    const addr = storiesPath + '/' + id + '/' + id + '.json';
    const {stories} = store.getState();
    const story = stories[id];
    return outputJson(addr, story)
          .then((res) => resolve({id, success: true}))
          .catch((err) => reject({id, success: false}))
  });

const writeStories = () =>
  new Promise((resolve, reject) => {
    const {stories} = store.getState();
    const storiesPromise = Object.keys(stories).map(id => writeStory(id));
    Promise.all(storiesPromise.map(p => p.catch(e => e)))
    .then((res) => resolve(res.filter(result => !result.success)))
    .catch((err) => reject(err));
  });

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
  writeStory,
  writeStories,
  deleteStory,
}