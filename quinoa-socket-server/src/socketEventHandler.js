import {writeStories} from './services/stories';

let numberConnections = 0;
let autoSaveInterval;

export default (io, store) => {
  io.on('connection', (socket) => {
    if(numberConnections === 0) {
        autoSaveInterval = setInterval(() => {
          writeStories()
          .then((res) => {
            // TODO add lastModified timestamp for story
            if(res.length > 0) {
              res.forEach((id) => {
                io.in(id).emit('action', {type: `SAVE_STORIES_FAIL`, payload: {id}})
              });
            }
          })
        }, 2000);
    }
    numberConnections ++;
    io.emit('action', {type:'UPDATE_CONNECTIONS_NUMBER', number: numberConnections});
    socket.emit('action', {type:'SET_SOCKET_ID', payload: socket.id});
    socket.emit('action', {type:'INIT_STATE', payload: store.getState()});

    socket.on('action', (action) => {
      const {payload} = action;

      if (action.type === 'ENTER_BLOCK') {
        const {connections} = store.getState();
        const {users} = connections[payload.storyId] || {};
        const blockList = Object.keys(users)
                        .map((id) => users[id])
                        .filter((user) => user.status === 'active')
                        .map((user)=> user.blockId);

        if (blockList.length === 0 || blockList.indexOf(payload.blockId) === -1) {
          store.dispatch(action);
          // socket.to(action.meta.room).emit('action', {type: `${action.type}_BROADCAST`, payload});
          io.in(action.meta.room).emit('action', {type: `${action.type}_BROADCAST`, payload});
        }
        else socket.emit('action', {type: `${action.type}_FAIL`, payload: action.payload});
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
      store.dispatch({type: 'DISCONNECT', payload: {userId: socket.id, rooms}});
      rooms.forEach((id) => {
        if(io.sockets.adapter.rooms[id].length === 1 && io.sockets.adapter.rooms[id].sockets[socket.id]) {
          store.dispatch({type: 'INACTIVATE_STORY', payload: {id}});
        }
      });
      io.emit('action', {type: 'DISCONNECT', payload: {userId: socket.id, rooms}});
    });
    socket.on('disconnect', () => {
      numberConnections --;
      io.emit('action', {type:'UPDATE_CONNECTIONS_NUMBER', number: numberConnections});
      if(numberConnections === 0) {
        clearInterval(autoSaveInterval);
      }
    });
  });
}