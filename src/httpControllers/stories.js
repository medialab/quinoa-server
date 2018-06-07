import manager from '../services/stories';
import store from '../store/configureStore';
import validateStory from '../validators/schemaValidator';

export const createStory = (req, res) => {
  const validation = validateStory(req.body.payload);
  if (validation.errors) {
    return res.status(400).json({message: validation.errors})
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
  manager.getStory(req.params.id)
  .then((result) => {
    let story = result;
    const socket = req.io.sockets.sockets[req.query.userId];
    if(req.query.edit === 'true' && socket) {
      const {stories, connections} = store.getState();
      const {locking} = connections;
      if (stories[req.params.id]) {
        story = stories[req.params.id]
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
          locks: (locking[story.id] && locking[story.id].locks) || {},
        }
      });
      socket.join(story.id);
      socket.to(story.id).emit('action', {
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

export const updateStory = (req, res) => {
  const validation = validateStory(req.body);
  if (validation.errors) {
    return res.status(400).json({message: validation.errors})
  }
  manager.writeStory(req.body)
  .then((result) => {
    res.status(200).json(result);
  })
  .catch((err) => {
    res.status(403).json({message: err.message});
  });
}

export const deleteStory = (req, res) => {
  // TODO: prevent delete if room is not empty
  const {locking} = store.getState().connections;
  const users = locking[req.params.id] && Object.keys(locking[req.params.id].locks);
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