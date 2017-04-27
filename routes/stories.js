const app = require('../server');

const manager = require('../services/storiesManager');
const bundleStory = require('../services/storyBundler');

app.get('/stories/:id?', (req, res) => {
  if (req.params.id) {
    manager.getStory(req.params.id, (err, presentation) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        if (req.query && req.query.format && req.query.format === 'html') {
          const bundle = bundleStory(presentation);
          res.setHeader('Content-Type', 'text/html');
          res.send(bundle);
        } else {
          res.send(presentation);
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
  manager.updateStory(req.params.id, req.body, (err, presentation) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(presentation);
  });
});

app.put('/stories/:id', (req, res) => {
  manager.createStory(req.body, (err, presentation) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(presentation);
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