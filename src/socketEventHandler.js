// import {saveAllStories} from './ducks/stories';
import {writeStories} from './services/stories';
import store from './store/configureStore';
import selectors from './ducks';

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
              res.forEach((id) => {
                io.in(id).emit('action', {type: `SAVE_STORIES_FAIL`, payload: {id}})
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
      const {storiesMap, lockingMap} = selectors()
      if (action.type === 'ENTER_BLOCK' || action.type === 'DELETE_SECTION' || action.type === 'DELETE_RESOURCE' ) {
        // check if story is activate
        if (!storiesMap[payload.storyId]) {
          if (callback) callback({message: 'story is not exist'});
          return socket.emit('action', {type:`${action.type}_FAIL`, payload: action.payload, message: 'story is not exist'});
        }
        const block = storiesMap[payload.storyId][payload.location];
        // check if block is exist
        if ((payload.location === 'resources' || payload.location === 'sections') && !block[payload.blockId]) {
          if (callback) callback({message: 'block is not exist'});
          socket.emit('action', {type: `${action.type}_FAIL`, payload: action.payload, message: 'block is not exist'});
        }
        else {
          const locks = (lockingMap[payload.storyId] && lockingMap[payload.storyId].locks) || {};
          const blockList = Object.keys(locks)
                            .map((id) => locks[id])
                            .filter((lock) => {
                              return lock[payload.location] !== undefined && lock[payload.location].status === 'active';
                            })
                            .map((lock) => lock[payload.location].blockId);
          // check if block is been taken
          if (blockList.length === 0 || blockList.indexOf(payload.blockId) === -1) {
            store.dispatch(action);
            if (callback) callback(null, {type: `${action.type}_SUCCESS`, payload});
            socket.emit('action', {type: `${action.type}_SUCCESS`, payload});
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
            if(io.sockets.adapter.rooms[id].length === 1 && io.sockets.adapter.rooms[id].sockets[socket.id]) {
              store.dispatch({type: 'INACTIVATE_STORY', payload: {id}});
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
      const rooms = Object.keys(socket.rooms).filter(d => d !== socket.id);
      store.dispatch({type: 'USER_DISCONNECTING', payload: {userId: socket.id, rooms}});
      rooms.forEach((id) => {
        if(io.sockets.adapter.rooms[id].length === 1 && io.sockets.adapter.rooms[id].sockets[socket.id]) {
          store.dispatch({type: 'INACTIVATE_STORY', payload: {id}});
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