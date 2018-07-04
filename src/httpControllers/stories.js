import manager from '../services/stories';
import bundleStory from '../helpers/storyBundler';

import store from '../store/configureStore';
import {validateStory} from '../validators/schemaValidator';
import validateStoryEntity from '../validators/entityValidator';


import selectors from '../ducks';

export const createStory = (req, res) => {
  let validation = validateStory(req.body.payload);
  if (!validation.valid) {
    return res.status(400).json({errors: validation.errors});
  }
  validation = validateStoryEntity(req.body.payload);
  if (!validation.valid) {
    return res.status(400).json({errors: validation.errors});
  }

  manager.createStory(req.body.payload, req.body.password)
  .then((result) => {
    req.io.emit('action', {type: 'CREATE_STORY_BROADCAST', payload: result.story});
    res.status(200).json(result);
  })
  .catch((err) => {
    res.status(403).json({message: err.message})
  });
}

export const getStories = (req, res) => {
  manager.getStories()
  .then((result) => {
    res.status(200).json(result);
  })
  .catch((err) => {
    res.status(403).json({message: err.message})
  });
}

export const getStory = (req, res) => {
  if (req.query.format)  {
    manager.getStoryBundle(req.params.id)
    .then((storyBundle) => {
      if (req.query.format === 'html') {
        const bundleHtml = bundleStory(storyBundle);
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(bundleHtml);
      }
      else res.status(200).json(storyBundle);
    })
    .catch((err) => {
      res.status(403).json({message: err.message})
    });
  }
  else {
    manager.getStory(req.params.id)
    .then((result) => {
      let story = result;
      const socket = req.io.sockets.sockets[req.query.userId];
      if(req.query.edit === 'true' && socket) {
        const {storiesMap, lockingMap} = selectors(store.getState());
        if (storiesMap[req.params.id]) {
          story = storiesMap[req.params.id];
        }
        else {
          store.dispatch({
            type: 'ACTIVATE_STORY',
            payload: story
          });
        }
        store.dispatch({
          type: 'ENTER_STORY',
          payload: {
            storyId: story.id,
            userId: req.query.userId
          }
        });
        socket.emit('action', {
          type: 'ENTER_STORY_INIT',
          payload: {
            storyId: story.id,
            locks: (lockingMap[story.id] && lockingMap[story.id].locks) || {},
          }
        });
        socket.join(story.id);
        socket.broadcast.emit('action', {
        // socket.to(story.id).emit('action', {
          type: 'ENTER_STORY_BROADCAST',
          payload: {
            storyId: story.id,
            userId: req.query.userId
          }
        });
      }
      res.status(200).json(story);
    })
    .catch((err) => {
      res.status(403).json({message: err.message})
    });
  }
}

export const updateStory = (req, res) => {
  let validation = validateStory(req.body.payload);
  if (!validation.valid) {
    return res.status(400).json({errors: validation.errors});
  }
  validation = validateStoryEntity(req.body.payload);
  if (!validation.valid) {
    return res.status(400).json({errors: validation.errors});
  }

  manager.updateStory(req.body)
  .then((result) => {
    res.status(200).json(result);
  })
  .catch((err) => {
    res.status(403).json({message: err.message});
  });
}

export const deleteStory = (req, res) => {
  // TODO: prevent delete if room is not empty
  const {lockingMap} = selectors(store.getState());
  const users = lockingMap[req.params.id] && Object.keys(lockingMap[req.params.id].locks);
  if (users && users.length > 0) {
    return res.status(400).json({message: 'the story is being edited, not allowed to delete'});
  }
  manager.deleteStory(req.params.id)
  .then((result) => {
    store.dispatch({type: 'DELETE_STORY', payload: {id: req.params.id}});
    req.io.emit('action', {type: 'DELETE_STORY_BROADCAST', payload: {id: req.params.id}});
    res.status(200).json(result);
  })
  .catch((err) => {
    res.status(403).json({message: err.message})
  });
}