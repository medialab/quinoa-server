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
    const socket = req.io.sockets.sockets[req.query.userId];
    if(socket) {
      manager.getActiveStory(req.params.id,req.query.userId,socket)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => {
        res.status(403).json({message: err.message})
      });
    }
    else {
      res.status(403).json({message: "invalid socket"});
    }
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
    req.io.emit('action', {type: 'DELETE_STORY_BROADCAST', payload: {id: req.params.id}});
  })
  .catch((err) => {
    res.status(403).json({message: err.message})
  });
}