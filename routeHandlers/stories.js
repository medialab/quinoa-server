/**
 * This module handles requests asking to interact with locally
 * stored presentations
 * ==========
 * @module quinoa-server/routes/presentations
 */

// the module relies on the storiesManager service to handle CRUD
// on locally stored data (see the data folder)
const manager = require('../services/storiesManager');
// the module relies on the storyBundler service to render
// html representations of documents
const bundleStory = require('../services/storyBundler');

/**
 * Resolves requests asking to render one
 * or all stories, in json or as html all-in-one representations
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
const getStories = (req, res) => {
  // if id in request param --> render 1 story
  if (req.params.id) {
    // if format='html' in query render as all-in-one-html story
    if (req.query && req.query.format) {
      manager.getStoryBundle(req.params.id, (err, story) => {
        if (err) {
          return res.status(500).send(err);
        } else {
          if (req.query.format === 'json')
            res.send(story)
          if (req.query.format === 'html') {
            const bundleHtml = bundleStory(story);
            res.setHeader('Content-Type', 'text/html');
            res.send(bundleHtml);
          }
          if (req.query.format === 'bundle') {
            manager.publishStory(req.params.id, story, (err) => {
              if (err) {
                return res.status(500).send(err);
              } else res.send({status: 'published'});
           });
          }
        }
      });
    }
    else {
      manager.getStory(req.params.id, (err, story) => {
        if (err) {
          return res.status(500).send(err);
        } else {
          res.send(story)
        }
      });
    }
  }
  // else render all stories in json
  else {
    manager.getStories(null, (err, stories) => {
      if (err) {
        return res.status(500).send(err);
      } else res.send(stories);
    });
  }
};

/**
 * Resolves requests asking to update an existing story
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
const updateStory = (req, res) => {
  manager.updateStory(req.params.id, req.body, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send({status: 'updated'});
  });
};
/**
 * Resolves requests asking to create a story
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
const createStory = (req, res) => {
  manager.createStory(req.body, (err, story) => {
    if (err) {
      return res.status(500).send(err);
    } else res.send(story);
  });
};

/**
 * Resolves requests asking to delete a specific story
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
const deleteStory = (req, res) => {
  manager.deleteStory(req.params.id, (err) => {
    if (err) {
      return res.status(500).send(err);
    // todo: brainstorm about the proper response
    // to send
    } else res.send({status: 'story deleted'});
  });
};

// exports a map of CRUD operations
module.exports = {
  getStories: getStories,
  updateStory: updateStory,
  createStory: createStory,
  deleteStory: deleteStory,
};