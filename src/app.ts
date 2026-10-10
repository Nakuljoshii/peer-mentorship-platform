import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './docs/swagger.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { mentorRouter } from './routes/mentor.routes.js';
import { appointmentRouter } from './routes/appointment.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { feedbackRouter } from './routes/feedback.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';


export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Peer Mentorship API is running' });
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/mentors', mentorRouter);
app.use('/api/v1/appointments', appointmentRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/feedback', feedbackRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/dashboard', dashboardRouter);

app.use(notFound);
app.use(errorHandler);
