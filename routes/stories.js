const manager = require('../services/storiesManager');
const bundleStory = require('../services/storyBundler');

const getStories = (req, res) => {
  if (req.params.id) {
    manager.getStory(req.params.id, (err, story) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        if (req.query && req.query.format && req.query.format === 'html') {
          const bundle = bundleStory(story);
          res.setHeader('Content-Type', 'text/html');
          res.send(bundle);
        } else {
          res.send(story);
        }
      }
    });
  }
  else {
    manager.getStories(null, (err, stories) => {
      if (err) {
        return res.status(500).send(err);
      } else res.send(stories);
    });
  }
};

const updateStory = (req, res) => {
  manager.updateStory(req.params.id, req.body, (err, story) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(story);
  });
};
const createStory = (req, res) => {
  manager.createStory(req.body, (err, story) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(story);
  });
};

const deleteStory = (req, res) => {
  manager.deleteStory(req.params.id, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send({
      status: 'deleted'
    });
  });
};

module.exports = {
  getStories: getStories,
  updateStory: updateStory,
  createStory: createStory,
  deleteStory: deleteStory,
};