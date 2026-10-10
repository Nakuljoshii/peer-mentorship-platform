import { Router } from 'express';
import { listNotifications, markNotificationRead } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
export const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get('/', listNotifications);
notificationRouter.patch('/:id/read', markNotificationRead);
