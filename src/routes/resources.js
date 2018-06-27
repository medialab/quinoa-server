import express from 'express';
import validator from 'validator';

import {createResource, getResource, updateResource, deleteResource} from '../httpControllers/resources';
import {verifyToken} from '../httpControllers/auth';

const router = new express.Router();

router.param('storyId', (req, res, next, value) => {
  if (!validator.isUUID(value)) {
    return res.status(400).json({message: 'invalid story id'});
  }
  else return next();
});

router.param('id', (req, res, next, value) => {
  if (!validator.isUUID(value)) {
    return res.status(400).json({message: 'invalid resource id'});
  }
  else return next();
});

router.get('/:storyId/:id', getResource);
router.post('/:storyId', verifyToken, createResource);
router.put('/:storyId/:id', verifyToken, updateResource);
router.delete('/:storyId/:id', verifyToken, deleteResource);

export default router;