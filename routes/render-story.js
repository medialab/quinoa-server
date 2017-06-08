const renderStory = require('../services/storyBundler');
const app = require('../server');


app.post('/render-story', (req, res) => {
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
    console.log('error: ', error);
    res.status(500).send(error);
  }
});