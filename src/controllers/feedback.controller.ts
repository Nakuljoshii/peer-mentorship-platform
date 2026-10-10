import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { Feedback } from '../models/Feedback.js';
import { AppError } from '../utils/AppError.js';
import { createNotification } from '../utils/notifications.js';

export async function createFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { appointmentId, rating, comment = '' } = req.body as Record<string, unknown>;
    if (typeof appointmentId !== 'string') throw new AppError('appointmentId is required', 400);
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new AppError('rating must be a whole number from 1 to 5', 400);
    if (typeof comment !== 'string' || comment.length > 1000) throw new AppError('comment must be text up to 1000 characters', 400);
    if (!mongoose.isValidObjectId(appointmentId)) throw new AppError('Invalid appointment ID', 400);
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new AppError('Appointment not found', 404);
    if (String(appointment.mentee) !== String(req.user!._id)) throw new AppError('Only the mentee can review this appointment', 403);
    if (appointment.status !== 'COMPLETED') throw new AppError('Feedback is only allowed for completed sessions', 409);
    if (await Feedback.exists({ appointment: appointment._id })) throw new AppError('Feedback has already been submitted for this appointment', 409);
    const feedback = await Feedback.create({ appointment: appointment._id, mentor: appointment.mentor, mentee: appointment.mentee, rating: Number(rating), comment: comment.trim() });
    await createNotification(appointment.mentor, 'FEEDBACK_RECEIVED', 'You received feedback for a completed session', feedback._id);
    res.status(201).json({ feedback });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) { next(new AppError('Feedback has already been submitted for this appointment', 409)); return; }
    next(error);
  }
}

export async function listMyFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter = req.user!.role === 'mentor' ? { mentor: req.user!._id } : { mentee: req.user!._id };
    const feedback = await Feedback.find(filter).populate('mentor', 'name').populate('mentee', 'name').populate('appointment', 'startTime endTime status').sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (error) { next(error); }
}

export async function getMentorRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.params.mentorId;
    if (typeof mentorId !== 'string' || !mongoose.isValidObjectId(mentorId)) throw new AppError('Invalid mentor ID', 400);
    const [summary] = await Feedback.aggregate([{ $match: { mentor: new mongoose.Types.ObjectId(mentorId) } }, { $group: { _id: '$mentor', averageRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }]);
    if (!summary) { res.json({ mentorId: req.params.mentorId, averageRating: 0, totalRatings: 0 }); return; }
    res.json({ mentorId: req.params.mentorId, averageRating: Math.round(summary.averageRating * 100) / 100, totalRatings: summary.totalRatings });
  } catch (error) { next(error); }
}
