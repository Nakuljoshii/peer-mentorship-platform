import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { Conversation } from './models/Conversation.js';
import { verifyAccessToken } from './utils/jwt.js';
import { createNotification } from './utils/notifications.js';

async function startServer(): Promise<void> {
  await connectDatabase();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, { cors: { origin: env.corsOrigin } });

  io.use(async (socket: any, next: (error?: Error) => void) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') return next(new Error('Authentication token is required'));
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId).select('_id role');
      if (!user) return next(new Error('Unauthenticated'));
      socket.data.userId = String(user._id);
      next();
    } catch { next(new Error('Invalid or expired authentication token')); }
  });

  io.on('connection', (socket: any) => {
    socket.on('conversation:join', async (conversationId: string, callback?: (result: unknown) => void) => {
      try {
        const conversation = await Conversation.findById(conversationId).select('mentor mentee');
        if (!conversation || ![String(conversation.mentor), String(conversation.mentee)].includes(socket.data.userId)) {
          callback?.({ error: 'Conversation not found or access denied' });
          return;
        }
        socket.join(`conversation:${conversationId}`);
        callback?.({ joined: true });
      } catch { callback?.({ error: 'Unable to join conversation' }); }
    });

    socket.on('message:send', async (payload: { conversationId?: string; content?: string }, callback?: (result: unknown) => void) => {
      try {
        const conversationId = payload?.conversationId;
        const content = payload?.content?.trim();
        if (!conversationId || !content || content.length > 4000) { callback?.({ error: 'conversationId and content (1-4000 characters) are required' }); return; }
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || ![String(conversation.mentor), String(conversation.mentee)].includes(socket.data.userId)) { callback?.({ error: 'Conversation not found or access denied' }); return; }
        const { Message } = await import('./models/Message.js');
        const message = await Message.create({ conversation: conversation._id, sender: socket.data.userId, content });
        conversation.updatedAt = new Date(); await conversation.save();
        const recipient = socket.data.userId === String(conversation.mentor) ? conversation.mentee : conversation.mentor;
        await createNotification(recipient, 'NEW_MESSAGE', 'You received a new message', conversation._id);
        io.to(`conversation:${conversationId}`).emit('message:new', message);
        callback?.({ message });
      } catch { callback?.({ error: 'Unable to send message' }); }
    });
  });

  httpServer.listen(env.port, () => console.info(`API listening on port ${env.port}`));
}

startServer().catch((error: unknown) => {
  console.error('Failed to start the server', error);
  process.exit(1);
});
