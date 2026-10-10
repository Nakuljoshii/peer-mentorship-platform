import type { NextFunction, Request, Response } from 'express';
import { Appointment } from '../models/Appointment.js';
import { Feedback } from '../models/Feedback.js';
import { MentorProfile } from '../models/MentorProfile.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const now = new Date();
    if (req.user!.role === 'mentor') {
      const [totalMentees, upcomingAppointments, completedSessions, ratingRows, recentFeedback, profile] = await Promise.all([
        Appointment.distinct('mentee', { mentor: userId, status: { $ne: 'CANCELLED' } }),
        Appointment.find({ mentor: userId, status: { $in: ['PENDING', 'CONFIRMED'] }, startTime: { $gte: now } }).populate('mentee', 'name email').sort({ startTime: 1 }),
        Appointment.countDocuments({ mentor: userId, status: 'COMPLETED' }),
        Feedback.aggregate([{ $match: { mentor: userId } }, { $group: { _id: null, averageRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }]),
        Feedback.find({ mentor: userId }).populate('mentee', 'name').populate('appointment', 'startTime').sort({ createdAt: -1 }).limit(5),
        MentorProfile.findOne({ user: userId }).select('availability'),
      ]);
      const averageRating = ratingRows[0] ? Math.round(ratingRows[0].averageRating * 100) / 100 : 0;
      res.json({ role: 'mentor', totalMentees: totalMentees.length, upcomingAppointments, completedSessions, averageRating, recentFeedback, availabilityStatus: Boolean(profile?.availability.some((slot) => slot.isActive)) });
      return;
    }
    const [appointments, upcomingAppointments, completedSessions, conversations, feedbackGiven] = await Promise.all([
      Appointment.find({ mentee: userId, status: { $ne: 'CANCELLED' } }).distinct('mentor').then(async (ids) => import('../models/User.js').then(({ User }) => User.find({ _id: { $in: ids } }).select('name email'))),
      Appointment.find({ mentee: userId, status: { $in: ['PENDING', 'CONFIRMED'] }, startTime: { $gte: now } }).populate('mentor', 'name email').sort({ startTime: 1 }),
      Appointment.countDocuments({ mentee: userId, status: 'COMPLETED' }),
      Conversation.find({ mentee: userId }).select('_id mentor').sort({ updatedAt: -1 }),
      Feedback.find({ mentee: userId }).populate('mentor', 'name').populate('appointment', 'startTime').sort({ createdAt: -1 }),
    ]);
    const conversationIds = conversations.map((conversation) => conversation._id);
    const recentMessages = await Message.find({ conversation: { $in: conversationIds } }).populate('sender', 'name role').sort({ createdAt: -1 }).limit(10);
    res.json({ role: 'mentee', bookedMentors: appointments, upcomingAppointments, completedSessions, recentMessages, feedbackGiven });
  } catch (error) { next(error); }
}
