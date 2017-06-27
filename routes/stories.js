const app = require('../server');

const manager = require('../services/storiesManager');
const bundleStory = require('../services/storyBundler');

app.get('/stories/:id?', (req, res) => {
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
});

app.patch('/stories/:id', (req, res) => {
  console.log('will update a story');
  manager.updateStory(req.params.id, req.body, (err, story) => {
    if (err) {
      console.log('error', error);
      return res.status(500).send(err);
    } else res.send(story);
  });
});

app.put('/stories/:id', (req, res) => {
  manager.createStory(req.body, (err, story) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(story);
  });
});

app.delete('/stories/:id', (req, res) => {
  manager.deleteStory(req.params.id, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send({
      status: 'deleted'
    });
  });
});