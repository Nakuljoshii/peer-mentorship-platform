import { Router } from 'express';
import { getCurrentUser, getMentorArea, login, register } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getCurrentUser);
authRouter.get('/mentor-area', authenticate, authorize('mentor'), getMentorArea);
