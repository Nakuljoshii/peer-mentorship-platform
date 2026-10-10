import { Router } from 'express';
import { getMessages, getOrCreateConversation, listConversations, sendMessage } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
export const chatRouter = Router();
chatRouter.use(authenticate);
chatRouter.get('/conversations', listConversations);
chatRouter.post('/conversations', getOrCreateConversation);
chatRouter.get('/conversations/:conversationId/messages', getMessages);
chatRouter.post('/conversations/:conversationId/messages', sendMessage);
