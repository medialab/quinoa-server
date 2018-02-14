const router = require('express').Router();

const manager = require('../services/resourcesManager');
const verifyToken = require('./verifyToken');

router.get('/:storyId/:id?', function(req, res) {
  // if id in request param --> render 1 resource
  if (req.params.id) {
    manager.getResource(req.params.storyId, req.params.id, (err, resource) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        res.send(resource);
      }
    });
  }
  // else render all resources in json
  else {
    manager.getResources(req.params.storyId, (err, resources) => {
      if (err) {
        return res.status(500).send(err);
      } else res.send(resources);
    });
  }
});

router.post('/:storyId', verifyToken, function(req, res) {
  manager.createResource(req.params.storyId, req.body, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send({status: 'resources created'});
  });
});

router.put('/:storyId/:id', verifyToken, function(req, res) {
  manager.updateResource(req.params.storyId, req.params.id, req.body, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send({status: 'resources updated'});
  });
});

router.delete('/:storyId/:id', verifyToken, function(req, res) {
  manager.deleteResource(req.params.storyId, req.params.id, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send({status: 'resource deleted'});
  });
});

router.delete('/:storyId', function(req, res) {
  manager.deleteResourceCollection(req.params.storyId, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send({status: 'story resources deleted'});
  });
});

module.exports = router;
