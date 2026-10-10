import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';

export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = { recipient: req.user!._id };
    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments(filter),
    ]);
    res.json({ notifications, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Invalid notification ID', 400);
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user!._id }, { $set: { readAt: new Date() } }, { new: true });
    if (!notification) throw new AppError('Notification not found', 404);
    res.json({ notification });
  } catch (error) { next(error); }
}
