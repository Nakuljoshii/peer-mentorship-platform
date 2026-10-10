import { Schema, model, type InferSchemaType } from 'mongoose';

const feedbackSchema = new Schema({
  appointment: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true, index: true },
  mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mentee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: true, versionKey: false });
feedbackSchema.index({ mentor: 1, createdAt: -1 });
export type FeedbackFields = InferSchemaType<typeof feedbackSchema>;
export const Feedback = model<FeedbackFields>('Feedback', feedbackSchema);
