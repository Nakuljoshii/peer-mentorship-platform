import { Router } from 'express';
import { createProfile, getMentorAvailability, getMentorProfile, getMyProfile, replaceAvailability, searchMentors, updateMyProfile } from '../controllers/mentor.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const mentorRouter = Router();
mentorRouter.get('/', searchMentors);
mentorRouter.post('/profile', authenticate, authorize('mentor'), createProfile);
mentorRouter.get('/profile/me', authenticate, authorize('mentor'), getMyProfile);
mentorRouter.patch('/profile/me', authenticate, authorize('mentor'), updateMyProfile);
mentorRouter.put('/availability', authenticate, authorize('mentor'), replaceAvailability);
mentorRouter.get('/:mentorId/availability', getMentorAvailability);
mentorRouter.get('/:mentorId', getMentorProfile);
