import config from 'config';
import {resolve} from 'path';

import manager from '../services/resources';
import store from '../store/configureStore';
import validateResource from '../validators/resourceValidator';

const dataPath = config.get('dataFolder');
const storiesPath = resolve(`${dataPath}/stories`);

export const createResource = (req, res) => {
  const {storyId} = req.params;
  const {id} = req.body;

  const validation = validateResource(req.body);
  if (validation.error) {
    return res.status(400).json({message: validation.error});
  }

  const socket = req.io.sockets.sockets[req.query.userId];
  manager.createResource(storyId, id, req.body)
  .then((result) => {
    store.dispatch({
      type: 'CREATE_RESOURCE',
      payload: {
        storyId,
        resourceId: id,
        resource: result,
        lastUpdateAt: parseInt(req.query.lastUpdateAt),
      }
    });
    socket.to(storyId).emit('action', {
      type: 'CREATE_RESOURCE_BROADCAST',
      payload: {
        storyId,
        resourceId: id,
        resource: result,
        lastUpdateAt: parseInt(req.query.lastUpdateAt),
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

  const validation = validateResource(req.body);
  if (validation.error) {
    return res.status(400).json({message: validation.error});
  }

  const socket = req.io.sockets.sockets[req.query.userId];
  manager.createResource(storyId, id, req.body)
  .then((result) => {
    store.dispatch({
      type: 'UPDATE_RESOURCE',
      payload: {
        storyId,
        resourceId: id,
        resource: result,
        lastUpdateAt: parseInt(req.query.lastUpdateAt)
      }
    });
    socket.to(storyId).emit('action', {
      type: 'UPDATE_RESOURCE_BROADCAST',
      payload: {
        storyId,
        resourceId: id,
        resource: result,
        lastUpdateAt: parseInt(req.query.lastUpdateAt)
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
  const {locking} = store.getState().connections;
  const locks = (locking[storyId] && locking[storyId].locks) || {};
  const blockList = Object.keys(locks)
                    .map((id) => locks[id])
                    .filter((lock) => {
                      return lock.status === 'active' && lock.location === 'resource';
                    })
                    .map((lock)=> lock.blockId);
  if (blockList.length === 0 || blockList.indexOf(id) === -1) {
    manager.deleteResource(storyId, id)
    .then((result) => {
      store.dispatch({
        type: 'DELETE_RESOURCE',
        payload: {
          storyId,
          resourceId: id,
          lastUpdateAt: parseInt(req.query.lastUpdateAt)
        }
      });
      socket.to(storyId).emit('action', {
        type: 'DELETE_RESOURCE_BROADCAST',
        payload: {
          storyId,
          resourceId: id,
          lastUpdateAt: parseInt(req.query.lastUpdateAt)
        }
      });
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(403).json({message: err.message})
    });
  }
  else res.status(403).json({message: 'resource is being edit by other user'});
}
