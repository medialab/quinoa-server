// import {saveAllStories} from './ducks/stories';
import {writeStories, writeStory} from './services/stories';
import store from './store/configureStore';
import selectors from './ducks';
import cleanStory from './validators/storyUtils';

let autoSaveInterval;

export default (io, store) => {
  io.on('connection', (socket) => {
    const {count} = store.getState().connections.users;
    if(count === 0) {
        autoSaveInterval = setInterval(() => {
          const timeAfter = new Date().getTime() - 2000;
          writeStories(timeAfter)
          .then((res) => {
            // check if lastUpdateAt timestamp changed
            if(res.length > 0) {
              res.forEach((item) => {
                io.in(item.id).emit('action', {type: `SAVE_STORY_FAIL`, payload: {id: item.id, errors: item.errors}})
              });
            }
          })
          // store.dispatch(saveAllStories(timeAfter))
        }, 2000);
    }
    store.dispatch({type:'USER_CONNECTED'});
    socket.emit('action', {type:'USER_CONNECTED', payload: store.getState().connections});
    socket.emit('action', {type:'SET_SOCKET_ID', payload: socket.id});

    socket.on('action', (action, callback) => {
      const {payload} = action;
      const state = store.getState();
      const {storiesMap, lockingMap} = selectors(state);
      // check is storyId exist (room)
      if (action.meta.room && !storiesMap[action.meta.room]) {
        return socket.emit('action', {type:`${action.type}_FAIL`, payload: action.payload, message: 'story is not exist'});
      }
      else if (action.meta.room && action.meta.blockId && action.meta.blockType) {
        const block = storiesMap[action.meta.room][action.meta.blockType];
        /**
         * check if block is exist
         * ENTER_SECTION, ENTER_RESOURCE, UPDATE_SECTION, UPDATE_RESOURCE, DELETE_SECTION, DELETE_RESOURCE
         */
        if ((action.meta.blockType === 'resources' || action.meta.blockType === 'sections') && !block[action.meta.blockId]) {
          if (callback) callback({message: 'block is not exist'});
          socket.emit('action', {type: `${action.type}_FAIL`, payload: action.payload, message: 'block is not exist'});
        }
        /**
         * check if block is taken
         * ENTER_BLOCK, UPDATE_SECTION, UPDATE_RESOURCE, DELETE_SECTION, DELETE_RESOURCE
         */
        else {
          const locks = (lockingMap[action.meta.room] && lockingMap[action.meta.room].locks) || {};
          const blockList = Object.keys(locks)
                            .map((id) => locks[id])
                            .filter((lock) => {
                              return lock[action.meta.blockType] !== undefined && lock[action.meta.blockType].status === 'active';
                            })
                            .map((lock) => lock[action.meta.blockType].blockId);
          // block is empty
          if (blockList.length === 0 || blockList.indexOf(action.meta.blockId) === -1 || (locks[action.meta.userId] && locks[action.meta.userId][action.meta.blockType] && locks[action.meta.userId][action.meta.blockType].userId === action.meta.userId)) {
            store.dispatch(action);
            if (callback) callback(null, {type: `${action.type}_SUCCESS`, payload});
            socket.emit('action', {type: `${action.type}_SUCCESS`, payload});
            // broadcast to room (storyId)
            socket.to(action.meta.room).emit('action', {type: `${action.type}_BROADCAST`, payload});
          }
          else {
            if (callback) callback({message: 'block is taken by other user'});
            socket.emit('action', {type: `${action.type}_FAIL`, payload: action.payload, message:'block is taken by other user'});
          }
        }
      }
      else {
        store.dispatch(action);
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
      }
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
      }
    });
  });
}