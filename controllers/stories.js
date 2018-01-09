const router = require('express').Router();

const verifyToken = require('./verifyToken');
const storiesRoutes = require('../routeHandlers/stories');

router.get('/:id?', storiesRoutes.getStories);
router.put('/:id', verifyToken, storiesRoutes.updateStory);
router.post('/', storiesRoutes.createStory);
router.delete('/:id', verifyToken, storiesRoutes.deleteStory);

module.exports = router;
