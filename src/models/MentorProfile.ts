import { Schema, model, type Document, type InferSchemaType } from 'mongoose';

export const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

const availabilitySchema = new Schema(
  {
    dayOfWeek: { type: String, enum: DAYS_OF_WEEK, required: true },
    startTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM time format'] },
    endTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM time format'] },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const mentorProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    headline: { type: String, trim: true, maxlength: 120, default: '' },
    bio: { type: String, trim: true, maxlength: 1500, default: '' },
    skills: { type: [String], default: [] },
    expertise: { type: [String], default: [] },
    experienceYears: { type: Number, required: true, min: 0, max: 60 },
    availability: { type: [availabilitySchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

mentorProfileSchema.index({ skills: 1, experienceYears: -1 });
mentorProfileSchema.index({ expertise: 1, experienceYears: -1 });

export type MentorProfileFields = InferSchemaType<typeof mentorProfileSchema>;
export type IMentorProfile = Document<unknown, object, MentorProfileFields> & MentorProfileFields;
export const MentorProfile = model<MentorProfileFields>('MentorProfile', mentorProfileSchema);
