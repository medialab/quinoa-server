/**
 * This module handles requests asking to render the html all-in-one
 * representation of a presentation
 * ==========
 * @module quinoa-server/routes/render-presentation
 */
// the module acts just as an interface to the renderPresentation service
const renderPresentation = require('../services/presentationBundler');

/**
 * Resolves a presentation rendering request
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
module.exports = (req, res) => {
  try {
    const presentation = req.body;
    // todo : put a presentation format validation hook here
    if (true) {
      const html = renderPresentation(presentation);
      res.send(html);
    } else {
      res.status(400);
    }
  } catch (error) {
    res.status(500).send(error);
  }
};