import { Schema, model, type InferSchemaType } from 'mongoose';

export const NOTIFICATION_TYPES = ['APPOINTMENT_CREATED', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'NEW_MESSAGE', 'FEEDBACK_RECEIVED'] as const;
const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: NOTIFICATION_TYPES, required: true },
  message: { type: String, required: true, maxlength: 300 },
  relatedId: { type: Schema.Types.ObjectId },
  readAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });
notificationSchema.index({ recipient: 1, createdAt: -1 });
export type NotificationFields = InferSchemaType<typeof notificationSchema>;
export const Notification = model<NotificationFields>('Notification', notificationSchema);
