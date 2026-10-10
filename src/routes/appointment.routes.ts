import { Router } from 'express';
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  createAppointment,
  getAppointment,
  getAppointments,
  getPastAppointments,
  getUpcomingAppointments,
} from '../controllers/appointment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const appointmentRouter = Router();

appointmentRouter.use(authenticate);

appointmentRouter.post('/', createAppointment);

appointmentRouter.get('/', getAppointments);

appointmentRouter.get('/upcoming', getUpcomingAppointments);

appointmentRouter.get('/past', getPastAppointments);

appointmentRouter.get('/:id', getAppointment);

appointmentRouter.patch('/:id/confirm', confirmAppointment);

appointmentRouter.patch('/:id/cancel', cancelAppointment);

appointmentRouter.patch('/:id/complete', completeAppointment);