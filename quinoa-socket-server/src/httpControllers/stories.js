import manager from '../services/stories';

export const createStory = (req, res) => {
  manager.createStory(req.body.payload, req.body.password)
  .then((result) => {
    res.status(200).json(result);
    req.io.emit('action', {type: 'CREATE_STORY_BROADCAST', payload: result.story});
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
  if(req.query.edit === 'true') {
    manager.getActiveStory(req.params.id)
    .then((result) => {
      const socketId = req.query.userId;
      const socket = req.io.sockets.sockets[socketId]
      socket.join(req.params.id);
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(403).json({message: err.message})
    });
  }
  else {
    manager.getStory(req.params.id)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(403).json({message: err.message})
    });
  }
}

export const deleteStory = (req, res) => {
  manager.deleteStory(req.params.id)
  .then((result) => {
    res.status(200).json(result);
    req.io.emit('action', {type: 'DELETE_STORY_BROADCAST', id: req.params.id});
  })
  .catch((err) => {
    res.status(403).json({message: err.message})
  });
}