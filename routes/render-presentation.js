const renderPresentation = require('../services/presentationBundler');

module.exports = (req, res) => {
  try {
    const presentation = req.body;
    // todo put a presentation format validation hook here
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