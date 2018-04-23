export const socketMiddleware = (io) => store => next => action => {
  const {payload, meta, socket, type} = action;

  if (type.indexOf('_FAIL') !== -1) {
    socket.emit('action', {type, error: action.error.message});
  }
  if (type.indexOf('_SUCCESS') !== -1) {
    switch (type) {
      case 'ENTER_STORY_SUCCESS':
        socket.join(payload.storyId);
        socket.emit('action', {type, payload: {...payload, users: io.sockets.adapter.rooms[payload.storyId]}});
        break;
      case 'LOGIN_STORY_SUCCESS':
        socket.join(payload.storyId);
        socket.emit('action', {type, token: action.result, payload});
        socket.emit('action', {type:'ENTER_STORY_SUCCESS', payload: {...payload, users: io.sockets.adapter.rooms[payload.storyId]}})
        break;
      case 'CREATE_STORY_SUCCESS':
        socket.join(payload.id);
        socket.emit('action', {type, token: action.result, payload});
        socket.emit('action', {type:'ENTER_STORY_SUCCESS', payload: {storyId: payload.id, userId: socket.id, users: io.sockets.adapter.rooms[payload.id]}});
        break;
      default:
        socket.emit('action', {type, payload});
        break;
    }
  }
  if (type === 'LEAVE_STORY') {
    socket.leave(payload.storyId);
    socket.emit('action', {type, payload: {...payload, users: io.sockets.adapter.rooms[payload.storyId]}});
  }
  if (meta.broadcast) {
    if (meta.room) {
      socket.to(meta.room).emit('action', {type: `${type}_BROADCAST`, payload: action.payload});
    }
    else
      socket.broadcast.emit('action', {type: `${type}_BROADCAST`, payload: action.payload});
  }
  return next(action);
}

export const promiseMiddleware = () => ({dispatch, getState}) => next => action => {
  if (typeof action === 'function') {
    return action(dispatch, getState);
  }
  const {promise, type, ...rest} = action;
  // If there is no promise in the action, ignore it
  if (!promise) {
    // pass the action to the next middleware
    return next(action);
  }
  // build constants that will be used to dispatch actions
  const REQUEST = type;
  const SUCCESS = type + '_SUCCESS';
  const FAIL = type + '_FAIL';
  // Trigger the action once to dispatch
  // the fact promise is starting resolving (for loading indication for instance)
  next({...rest, type: REQUEST});
  // resolve promise
  return promise(dispatch, getState).then(
    (result) => {
      return next({...rest, meta: {...rest.meta, broadcast: true}, result, type: SUCCESS});
    }).catch((error) => {
      return next({...rest, meta: {broadcast: false}, error, type: FAIL})
    });
}