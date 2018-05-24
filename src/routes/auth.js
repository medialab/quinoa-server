import express from 'express';
import {register, login, resetPassword} from '../httpControllers/auth';

const router = new express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/resetPassword', resetPassword)

export default router;