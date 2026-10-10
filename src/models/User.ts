import { Schema, model, type Document, type InferSchemaType } from 'mongoose';

export const USER_ROLES = ['mentor', 'mentee'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export type UserFields = InferSchemaType<typeof userSchema>;
export type IUser = Document<unknown, object, UserFields> & UserFields;
export const User = model<UserFields>('User', userSchema);
