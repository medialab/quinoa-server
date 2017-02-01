const app = require('../server');

const manager = require('../services/presentationsManager');
const bundlePresentation = require('../services/presentationBundler');

app.get('/presentations/:id?', (req, res) => {
  if (req.params.id) {
    manager.getPresentation(req.params.id, (err, presentation) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        if (req.query && req.query.format && req.query.format === 'html') {
          const bundle = bundlePresentation(presentation);
          res.setHeader('Content-Type', 'text/html');
          res.send(bundle);
        } else {
          res.send(presentation);
        }
      }
    });
  }
  else {
    manager.getPresentations(null, (err, presentations) => {
      if (err) {
        return res.status(500).send(err);
      } else res.send(presentations);
    });
  }
});

app.patch('/presentations/:id', (req, res) => {
  manager.updatePresentation(req.params.id, req.body, (err, presentation) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(presentation);
  });
});

app.put('/presentations/:id', (req, res) => {
  manager.createPresentation(req.body, (err, presentation) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(presentation);
  });
});

app.delete('/presentations/:id', (req, res) => {
  manager.updatePresentation(req.params.id, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send({
      status: 'deleted'
    });
  });
});