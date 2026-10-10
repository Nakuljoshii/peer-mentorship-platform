import { Notification, type NotificationFields } from '../models/Notification.js';
import type { Types } from 'mongoose';

type NotificationType = NotificationFields['type'];
export async function createNotification(recipient: Types.ObjectId | string, type: NotificationType, message: string, relatedId?: Types.ObjectId | string): Promise<void> {
  await Notification.create({ recipient, type, message, ...(relatedId ? { relatedId } : {}) });
}
