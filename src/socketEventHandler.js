// import {saveAllStories} from './ducks/stories';
import {writeStories} from './services/stories';

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
    io.emit('action', {type:'USER_CONNECTED', payload: store.getState()});
    socket.emit('action', {type:'SET_SOCKET_ID', payload: socket.id});

    socket.on('action', (action) => {
      const {payload} = action;
      if (action.type === 'ENTER_BLOCK' || action.type === 'DELETE_BLOCK') {
        const {locking} = store.getState().connections;
        const block = store.getState().stories[payload.storyId][payload.location];
        if ((payload.location === 'resource' || payload.location === 'section') && !block[payload.blockId]) {
          socket.emit('action', {type: `${action.type}_FAIL`, payload: action.payload});
        }
        else {
          const locks = (locking[payload.storyId] && locking[payload.storyId].locks) || {};
          const blockList = Object.keys(locks)
                            .map((id) => locks[id])
                            .filter((lock) => {
                              return lock.status === 'active' && lock.location === payload.location;
                            })
                            .map((lock)=> lock.blockId);
          if (blockList.length === 0 || blockList.indexOf(payload.blockId) === -1) {
            store.dispatch(action);
            socket.emit('action', {type: `${action.type}_SUCCESS`, payload});
            socket.to(action.meta.room).emit('action', {type: `${action.type}_BROADCAST`, payload});
          }
          else socket.emit('action', {type: `${action.type}_FAIL`, payload: action.payload});
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
    socket.on('disconnect', () => {
      store.dispatch({type:'USER_DISCONNECTED'});
      io.emit('action', {type:'USER_DISCONNECTED', payload: store.getState()});
      const {count} = store.getState().connections.users;
      if(count === 0) {
        clearInterval(autoSaveInterval);
      }
    });
  });
}