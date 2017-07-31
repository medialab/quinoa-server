/**
 * This module handles requests asking to render the html all-in-one
 * representation of a story
 * ==========
 * @module quinoa-server/routes/render-story
 */
// the module acts just as an interface to the renderStory service
const renderStory = require('../services/storyBundler');

/**
 * Resolves a story rendering request
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
module.exports = (req, res) => {
  try {
    const story = req.body;
    // todo put a story format validation hook here
    if (true) {
      const html = renderStory(story);
      res.send(html);
    } else {
      res.status(400);
    }
  } catch (error) {
    res.status(500).send(error);
  }
};