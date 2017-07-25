/**
 * This module handles requests asking to interact with locally
 * stored presentations
 * ==========
 * @module quinoa-server/routes/presentations
 */

// the module relies on the storiesManager service to handle CRUD
// on locally stored data (see the data folder)
const manager = require('../services/presentationsManager');
// the module relies on the storyBundler service to render
// html representations of documents
const bundlePresentation = require('../services/presentationBundler');

/**
 * Resolves requests asking to render one
 * or all presentations, in json or as html all-in-one representations
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
const getPresentations = (req, res) => {
  // if id in request param --> render 1 story
  if (req.params.id) {
    manager.getPresentation(req.params.id, (err, presentation) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        // if format='html' in query render as all-in-one-html presentation
        if (req.query && req.query.format && req.query.format === 'html') {
          const bundle = bundlePresentation(presentation);
          res.setHeader('Content-Type', 'text/html');
          res.send(bundle);
        // else render as json resource
        } else {
          res.send(presentation);
        }
      }
    });
  }
  // else render all presentations in json
  else {
    manager.getPresentations(null, (err, presentations) => {
      if (err) {
        return res.status(500).send(err);
      } else res.send(presentations);
    });
  }
};
/**
 * Resolves requests asking to update an existing presentation
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
const updatePresentation = (req, res) => {
  manager.updatePresentation(req.params.id, req.body, (err, presentation) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(presentation);
  });
};
/**
 * Resolves requests asking to create a presentation
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
const createPresentation = (req, res) => {
  manager.createPresentation(req.body, (err, presentation) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(presentation);
  });
};
/**
 * Resolves requests asking to delete a specific presentation
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
const deletePresentation = (req, res) => {
  manager.deletePresentation(req.params.id, (err) => {
    if (err) {
      return res.status(500).send(err);
    // todo: brainstorm about the proper response
    // to send
    } else res.send({
      status: 'deleted'
    });
  });
};

// exports a map of CRUD operations
module.exports = {
  getPresentations: getPresentations,
  updatePresentation: updatePresentation,
  createPresentation: createPresentation,
  deletePresentation: deletePresentation,
};