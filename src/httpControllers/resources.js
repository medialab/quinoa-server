import config from 'config';
import {resolve} from 'path';

import manager from '../services/resources';
import store from '../store/configureStore';
import {validateResource} from '../lib/schemaValidator';


const dataPath = config.get('dataFolder');
const storiesPath = resolve(`${dataPath}/stories`);

export const createResource = (req, res) => {
  const {storyId} = req.params;
  const {id} = req.body;
  //TODO: handle module level validation - resourceSchema
  // const validation = validateStory(req.body);
  // if (validation.errors) {
  //   res.status(400).json({err: validation.errors})
  // }
  const socket = req.io.sockets.sockets[req.query.userId];
  manager.createResource(storyId, id, req.body)
  .then((result) => {
    store.dispatch({
      type: 'CREATE_RESOURCE',
      payload: {
        storyId,
        resourceId: id,
        resource: result
      }
    });
    socket.to(storyId).emit('action', {
      type: 'CREATE_RESOURCE_BROADCAST',
      payload: {
        storyId,
        resourceId: id,
        resource: result
      }
    });
    res.status(200).json(result);
  })
  .catch((err) => {
    res.status(403).json({message: err.message})
  });
}

export const updateResource = (req, res) => {
  const {id, storyId} = req.params;
  //TODO: handle module level validation - resourceSchema
  // const validation = validateStory(req.body);
  // if (validation.errors) {
  //   res.status(400).json({err: validation.errors})
  // }
  const socket = req.io.sockets.sockets[req.query.userId];
  manager.createResource(storyId, id, req.body)
  .then((result) => {
    store.dispatch({
      type: 'UPDATE_RESOURCE',
      payload: {
        storyId,
        resourceId: id,
        resource: result
      }
    });
    socket.to(storyId).emit('action', {
      type: 'UPDATE_RESOURCE_BROADCAST',
      payload: {
        storyId,
        resourceId: id,
        resource: result
      }
    });
    res.status(200).json(result);
  })
  .catch((err) => {
    res.status(403).json({message: err.message})
  });
}

export const getResource = (req, res) => {
  const {storyId, id} = req.params;
  const filePath = `${storiesPath}/${storyId}/resources/${id}/${id}.json`;
  res.status(200).sendFile(filePath);
}

export const deleteResource = (req, res) => {
  const {id, storyId} = req.params;
  const socket = req.io.sockets.sockets[req.query.userId];
  manager.deleteResource(storyId, id)
  .then((result) => {
    store.dispatch({type: 'DELETE_RESOURCE', payload: {storyId, resourceId: id}});
    socket.to(storyId).emit('action', {type: 'DELETE_RESOURCE_BROADCAST', payload: {storyId, resourceId: id}});
    res.status(200).json(result);
  })
  .catch((err) => {
    res.status(403).json({message: err.message})
  });
}
