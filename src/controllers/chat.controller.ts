import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { createNotification } from '../utils/notifications.js';

export async function getOrCreateConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mentorId, menteeId, appointmentId } = req.body as Record<string, unknown>;
    let mentor: string; let mentee: string;
    if (req.user!.role === 'mentee') { mentee = String(req.user!._id); if (typeof mentorId !== 'string') throw new AppError('mentorId is required', 400); mentor = mentorId; }
    else { mentor = String(req.user!._id); if (typeof menteeId !== 'string') throw new AppError('menteeId is required', 400); mentee = menteeId; }
    if (!mongoose.isValidObjectId(mentor) || !mongoose.isValidObjectId(mentee)) throw new AppError('Valid mentorId and menteeId are required', 400);
    const mentorUser = await User.findOne({ _id: mentor, role: 'mentor' }).select('_id');
    const menteeUser = await User.findOne({ _id: mentee, role: 'mentee' }).select('_id');
    if (!mentorUser || !menteeUser) throw new AppError('Mentor or mentee not found', 404);
    if (appointmentId !== undefined) {
      if (typeof appointmentId !== 'string' || !mongoose.isValidObjectId(appointmentId)) throw new AppError('appointmentId is invalid', 400);
      const appointment = await Appointment.findOne({ _id: appointmentId, mentor, mentee });
      if (!appointment) throw new AppError('Related appointment not found for these participants', 404);
    }
    let conversation = await Conversation.findOne({ mentor, mentee });
    if (!conversation) conversation = await Conversation.create({ mentor, mentee, ...(appointmentId ? { appointment: appointmentId } : {}) });
    res.status(200).json({ conversation });
  } catch (error) { next(error); }
}

export async function listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversations = await Conversation.find({ $or: [{ mentor: req.user!._id }, { mentee: req.user!._id }] })
      .populate('mentor', 'name email').populate('mentee', 'name email').sort({ updatedAt: -1 });
    res.json({ conversations });
  } catch (error) { next(error); }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { content } = req.body as Record<string, unknown>;
    if (typeof content !== 'string' || !content.trim() || content.trim().length > 4000) throw new AppError('content must be text between 1 and 4000 characters', 400);
    if (!mongoose.isValidObjectId(req.params.conversationId)) throw new AppError('Invalid conversation ID', 400);
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);
    const userId = String(req.user!._id);
    if (![String(conversation.mentor), String(conversation.mentee)].includes(userId)) throw new AppError('You are not a participant in this conversation', 403);
    const message = await Message.create({ conversation: conversation._id, sender: req.user!._id, content: content.trim() });
    conversation.updatedAt = new Date(); await conversation.save();
    const recipient = userId === String(conversation.mentor) ? conversation.mentee : conversation.mentor;
    await createNotification(recipient, 'NEW_MESSAGE', 'You received a new message', conversation._id);
    res.status(201).json({ message });
  } catch (error) { next(error); }
}

export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!mongoose.isValidObjectId(req.params.conversationId)) throw new AppError('Invalid conversation ID', 400);
    const conversation = await Conversation.findById(req.params.conversationId).select('mentor mentee');
    if (!conversation) throw new AppError('Conversation not found', 404);
    if (![String(conversation.mentor), String(conversation.mentee)].includes(String(req.user!._id))) throw new AppError('You are not a participant in this conversation', 403);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversation._id }).populate('sender', 'name role').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Message.countDocuments({ conversation: conversation._id }),
    ]);
    res.json({ messages: messages.reverse(), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}
