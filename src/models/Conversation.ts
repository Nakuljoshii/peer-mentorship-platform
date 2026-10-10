import { Schema, model, type InferSchemaType } from 'mongoose';

const conversationSchema = new Schema({
  mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mentee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
}, { timestamps: true, versionKey: false });

conversationSchema.index({ mentor: 1, mentee: 1 }, { unique: true });
export type ConversationFields = InferSchemaType<typeof conversationSchema>;
export const Conversation = model<ConversationFields>('Conversation', conversationSchema);
