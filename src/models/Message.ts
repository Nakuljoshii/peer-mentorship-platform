import { Schema, model, type InferSchemaType } from 'mongoose';

const messageSchema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true, trim: true, minlength: 1, maxlength: 4000 },
  readAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });
messageSchema.index({ conversation: 1, createdAt: -1 });
export type MessageFields = InferSchemaType<typeof messageSchema>;
export const Message = model<MessageFields>('Message', messageSchema);
