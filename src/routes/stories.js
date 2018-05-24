import express from 'express';
import {getStories, createStory, getStory, updateStory, deleteStory} from '../httpControllers/stories';
import {verifyToken} from '../httpControllers/auth';

const router = new express.Router();

const checkMode = (req, res, next) => {
  if(req.query.edit === 'true') {
    return verifyToken(req, res, next);
  }
  else return next();
}
router.post('/', createStory);
router.get('/', getStories);
router.get('/:id', checkMode, getStory);
router.put('/:id', verifyToken, updateStory);
router.delete('/:id', verifyToken, deleteStory);

export default router;