const manager = require('../services/presentationsManager');
const bundlePresentation = require('../services/presentationBundler');

const getPresentations = (req, res) => {
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
};

const updatePresentation = (req, res) => {
  manager.updatePresentation(req.params.id, req.body, (err, presentation) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(presentation);
  });
};
const createPresentation = (req, res) => {
  manager.createPresentation(req.body, (err, presentation) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(presentation);
  });
};

const deletePresentation = (req, res) => {
  manager.deletePresentation(req.params.id, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send({
      status: 'deleted'
    });
  });
};

module.exports = {
  getPresentations: getPresentations,
  updatePresentation: updatePresentation,
  createPresentation: createPresentation,
  deletePresentation: deletePresentation,
};