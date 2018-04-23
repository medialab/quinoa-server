export const socketMiddleware = (io) => store => next => action => {
  const {payload, meta, socket, type} = action;
  if (type.indexOf('_SUCCESS') !== -1) {
    if (action.type === 'ENTER_STORY_SUCCESS') {
      socket.join(payload.storyId);
    }
    else if (type === 'CREATE_STORY_SUCCESS') {
      socket.emit('action', {type, token: action.result, payload});
    }
    else if (type === 'LOGIN_STORY_SUCCESS') {
      socket.emit('action', {type, token: action.result});
    }
    else socket.emit('action', {type, payload});
  }

  if (type.indexOf('_FAIL') !== -1) {
    socket.emit('action', {type, error: action.error.message});
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