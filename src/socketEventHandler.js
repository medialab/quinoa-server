// import {saveAllStories} from './ducks/stories';
import {writeStories, writeStory, getStory} from './services/stories';
import {checkToken} from './services/auth';
import store from './store/configureStore';
import selectors from './ducks';
import cleanStory from './validators/storyUtils';

let autoSaveInterval;
let idleCheckInterval;

const UPDATE_RATE = 2000;// timeout for updating stories to disk and spot idle users
const IDLE_ACTIVITY_THRESHOLD = 15 * 60000;// idling time = 15 minutes

export default (io, store) => {
  io.on('connection', (socket) => {
    const {count} = store.getState().connections.users;
    socket.join('home');
    // if no users on server before this connection
    // then we start repeating routines
    if(count === 0) {
        // auto save routine (saving from redux state to server hard drive)
        autoSaveInterval = setInterval(() => {
          // check if lastUpdatedAt timeStamp changed
          const timeAfter = new Date().getTime() - UPDATE_RATE;
          const {storiesMap} = selectors(store.getState());
          // we determine if a story has been updated in state
          // by checking its lastUpdateAt property
          const storiesUpdated = Object.keys(storiesMap)
                                 .map(id => storiesMap[id])
                                 .filter(story => story.lastUpdateAt >= timeAfter);
          // we write the stories that are changed
          writeStories(storiesUpdated)
          .then((res) => {
            // response concerns failed stories
            const storiesFailed = res.reduce((result, item) => ({
              ...result,
              [item.id]: item
            }), {});
            storiesUpdated.forEach((story) => {
              // broadcast failures
              if (Object.keys(storiesFailed).indexOf(story.id) !== -1) {
                io.in(story.id).emit('action', {type: `SAVE_STORY_FAIL`, payload: {id: story.id, errors: storiesFailed[story.id]}});
              }
              // broadcast successes
              else {
                io.in(story.id).emit('action', {type: `SAVE_STORY_SUCCESS`});
              }
            })
          })
        }, UPDATE_RATE);
        idleCheckInterval = setInterval(() => {
          const now = new Date().getTime();
          const {lockingMap = {}} = selectors(store.getState());
          Object.keys(lockingMap).forEach(storyId => {
          const lockMap = lockingMap[storyId];
          Object.keys(lockMap.locks).forEach(userId => {
            const user = lockMap.locks[userId];
            const {lastActivityAt} = user;
            if (lastActivityAt < now - IDLE_ACTIVITY_THRESHOLD && user.status !== 'idle') {
              const payload = {
                  storyId,
                  userId,
                };
              store.dispatch({
                type: 'SET_USER_AS_IDLE',
                payload,
              });
              io.to(storyId).emit('action', {type: `SET_USER_AS_IDLE_BROADCAST`, payload});
            }
          })
          })
        }, UPDATE_RATE);
    }
    store.dispatch({type:'USER_CONNECTED'});
    socket.emit('action', {type:'USER_CONNECTED', payload: store.getState().connections});
    socket.emit('action', {type:'SET_SOCKET_ID', payload: socket.id});

    /**
     * A client sends an action
     */
    socket.on('action', (action, callback) => {
      const {payload} = action;
      const state = store.getState();
      const {storiesMap, lockingMap} = selectors(state);

      Promise.resolve()
      /**
       * Step 1 : verify story exists if needed
       */
      .then(() => new Promise((resolve, reject) => {
        // check if storyId exists (room)
        if (action.meta.room && !storiesMap[action.meta.room]) {
          // try to read story from disk
          getStory(action.meta.room)
            // story was successfully loaded from disk
            .then((story) => {
              // activate story
              store.dispatch({
                type: 'ACTIVATE_STORY', 
                payload: story
              });
              // register new user for story
              store.dispatch({
                type: 'ENTER_STORY',
                payload: {
                  storyId: story.id,
                  userId: socket.id
                }
              });
              socket.emit('action', {
                type: 'ENTER_STORY_INIT',
                payload: {
                  storyId: story.id,
                  locks: (lockingMap[story.id] && lockingMap[story.id].locks) || {},
                }
              });
              // join corresponding room
              socket.join(story.id);
              socket.leave('home');
              socket.broadcast.emit('action', {
                type: 'ENTER_STORY_BROADCAST',
                payload: {
                  storyId: story.id,
                  userId: socket.id
                }
              });
              resolve();
            })
            // story does not exist -> return error
            .catch((error) => {
              if (typeof callback === 'function') {
                callback({message: 'story does not exist'});
              }
              socket.emit('action', {type:`${action.type}_FAIL`, payload: action.payload, message: 'story does not exist'});
              reject(error);
            })
        } else {
          resolve();
        }
      }))
      /**
       * Step 2 : verify request provides a valid access token if trying to interact with a story
       */
      .then(() => new Promise((resolve, reject) => {
        if (action.meta.room) {
          checkToken(action.token, err => {
            if (err) {
              socket.emit('action', {type: `${action.type}_FAIL`, payload: action.payload, message: 'invalid token'});
              return reject()
            } else resolve('invalid token');
          });
        } else resolve();
      }))
      /**
       * Step 3 : verify requested object exists and is not locked by another user
       */
      .then(() => new Promise((resolve, reject) => {
        if (action.meta.room && action.meta.blockId && action.meta.blockType && !action.meta.noLock) {
          // a block is a lockable object (section, resource, story metadata, story design)
          const block = storiesMap[action.meta.room] && storiesMap[action.meta.room][action.meta.blockType];
          
          /**
           * check if block exists
           * ENTER_SECTION, ENTER_RESOURCE, UPDATE_SECTION, UPDATE_RESOURCE, DELETE_SECTION, DELETE_RESOURCE
           */
          if ((action.meta.blockType === 'resources' || action.meta.blockType === 'sections') && (!block || !block[action.meta.blockId])) {
            if (typeof callback === 'function') {
              callback({message: 'block does not exist'});
            }
            socket.emit('action', {type: `${action.type}_FAIL`, payload: action.payload, message: 'block does not exist'});
            reject('block does not exist');
          }
          /**
           * check if block is taken
           * ENTER_BLOCK, UPDATE_SECTION, UPDATE_RESOURCE, DELETE_SECTION, DELETE_RESOURCE
           */
          else {
            // story users locks
            const locks = (lockingMap[action.meta.room] && lockingMap[action.meta.room].locks) || {};

            const lockedUser = Object.keys(locks)
                              .map((id) => locks[id])
                              .filter(lock => lock)
                              .find(lock => {
                                return lock[action.meta.blockType] !== undefined && lock[action.meta.blockType].blockId === action.meta.blockId
                              });
            // block is empty -> good to go
            if (
              // block is not locked
              !lockedUser
              // or block is locked by an idle user
              || lockedUser[action.meta.blockType].status === 'idle'
              // or current user is already locked on the block
              || lockedUser[action.meta.blockType].userId === action.meta.userId
            ) {
              // check for an idle user on the block
              // and kick her out if present
              if (lockedUser && lockedUser[action.meta.blockType].status === 'idle' && lockedUser[action.meta.blockType].userId !== action.meta.userId) {
                const leavePayload = {
                  storyId: action.payload.storyId,
                  userId: lockedUser[action.meta.blockType].userId,
                  blockType: action.meta.blockType
                };
                store.dispatch({
                  type: 'LEAVE_BLOCK',
                  payload: leavePayload
                });
                io.to(action.meta.room).emit('action', {type: `LEAVE_BLOCK_BROADCAST`, payload: leavePayload});
                // if user was idle and now comes back to the screen
                // then give him back the block
              } else if (lockedUser && lockedUser.status === 'idle') {
                const activePayload = {
                  storyId: action.payload.storyId,
                  userId: action.meta.userId,
                };
                store.dispatch({
                  type: 'SET_USER_AS_ACTIVE',
                  payload: activePayload,
                });
                io.to(action.meta.room).emit('action', {type: `SET_USER_AS_ACTIVE_BROADCAST`, payload: activePayload});
              }

              resolve();
            }
            else {
              if (typeof callback === 'function') {
                callback({message: 'block is taken by other user'});
              }
              socket.emit('action', {type: `${action.type}_FAIL`, payload: action.payload, message:'block is taken by other user'});
              reject('block is taken by other user');
            }
          }
        // handle idle users performing non-lock-related actions
        } else if (action.payload.userId && action.payload.storyId) {
          const locks = (lockingMap[action.payload.storyId] && lockingMap[action.payload.storyId].locks) || {};
          const user = locks[action.payload.userId];
          if (user && user.status === 'idle') {
            const activePayload = {
              storyId: action.payload.storyId,
              userId: action.payload.userId,
            };
            store.dispatch({
              type: 'SET_USER_AS_ACTIVE',
              payload: activePayload,
            });
            io.to(action.payload.storyId).emit('action', {type: `SET_USER_AS_ACTIVE_BROADCAST`, payload: activePayload});
          }
          resolve();
        } else {
          resolve();
        }
      }))
      /**
       * Step 4 : emit response and trigger broadcasts/callbacks if needed
       */
      .then(() => {
        socket.emit('action', {type: `${action.type}_SUCCESS`, payload});
        store.dispatch(action);
        if (callback && typeof callback === 'function') {
          callback(null, {type: `${action.type}_SUCCESS`, payload});
        }
        if (action.meta.broadcast) {
          if (action.meta.room) {
            socket.to(action.meta.room).emit('action', {type: `${action.type}_BROADCAST`, payload});
          }
          else {
            socket.broadcast.emit('action', {type: `${action.type}_BROADCAST`, payload})
          }
        }
        if (action.type === 'LEAVE_STORY') {
          const rooms = Object.keys(socket.rooms).filter(d => d !== socket.id);
          rooms.forEach((id) => {
            if(io.sockets.adapter.rooms[id].length === 1 && io.sockets.adapter.rooms[id].sockets[socket.id] && storiesMap[id] !== undefined) {
              const story = Object.assign({}, storiesMap[id]);
              // INACTIVATE_STORY and clean story and write to disk;
              const cleanedStory = cleanStory(story);
              writeStory(cleanedStory)
              .then(() => store.dispatch({type: 'INACTIVATE_STORY', payload: {id}}));
            }
          });
        }
        // special case for handling metadata update display in home
        if (action.type === 'UPDATE_STORY_METADATA') {
          io.to('home').emit('action', {type: `${action.type}_BROADCAST`, payload})
        }
      })
      .catch(console.error)
    });

    /**
     * only socket disconnecting event has socket.rooms information
     * so udpate locking system for each room here
     */
    socket.on('disconnecting', () => {
      const state = store.getState();
      const {storiesMap, lockingMap} = selectors(state);

      const rooms = Object.keys(socket.rooms).filter(d => d !== socket.id);
      store.dispatch({type: 'USER_DISCONNECTING', payload: {userId: socket.id, rooms}});
      rooms.forEach((id) => {
        if(io.sockets.adapter.rooms[id].length === 1 && io.sockets.adapter.rooms[id].sockets[socket.id]) {
          // store.dispatch({type: 'INACTIVATE_STORY', payload: {id}});
          const {storiesMap} = selectors(state);
          if (storiesMap[id]) {
            const cleanedStory = cleanStory(storiesMap[id]);
            writeStory(cleanedStory)
            .then(() => store.dispatch({type: 'INACTIVATE_STORY', payload: {id}}));
          }
        }
      });
      io.emit('action', {type: 'USER_DISCONNECTING', payload: {userId: socket.id, rooms}});
    });

    /**
     * socket disconnect event triggered after disconnecting
     */
    socket.on('disconnect', () => {
      store.dispatch({type:'USER_DISCONNECTED', payload: {userId: socket.id}});
      io.emit('action', {type:'USER_DISCONNECTED', payload: store.getState().connections});
      const {count} = store.getState().connections.users;
      if(count === 0) {
        clearInterval(autoSaveInterval);
        clearInterval(idleCheckInterval);
      }
    });
  });
}