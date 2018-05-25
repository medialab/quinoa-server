import express from 'express';
import {createResource, getResource, updateResource, deleteResource} from '../httpControllers/resources';
import {verifyToken} from '../httpControllers/auth';

const router = new express.Router();

router.get('/:storyId/:id', getResource);
router.post('/:storyId', verifyToken, createResource);
router.put('/:storyId/:id', verifyToken, updateResource);
router.delete('/:storyId/:id', verifyToken, deleteResource);

export default router;