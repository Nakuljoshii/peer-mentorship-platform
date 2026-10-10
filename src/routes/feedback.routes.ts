import { Router } from 'express';
import { createFeedback, getMentorRatings, listMyFeedback } from '../controllers/feedback.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
export const feedbackRouter = Router();
feedbackRouter.get('/mentors/:mentorId/ratings', getMentorRatings);
feedbackRouter.use(authenticate);
feedbackRouter.post('/', createFeedback);
feedbackRouter.get('/mine', listMyFeedback);
