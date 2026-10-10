import { Schema, model, type InferSchemaType, type Document } from 'mongoose';

export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

const appointmentSchema = new Schema(
  {
    mentee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: 'PENDING',
      required: true,
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

appointmentSchema.index({
  mentor: 1,
  startTime: 1,
  endTime: 1,
  status: 1,
});

appointmentSchema.index({
  mentee: 1,
  startTime: 1,
});

export type AppointmentFields = InferSchemaType<typeof appointmentSchema>;

export type IAppointment = Document<
  unknown,
  object,
  AppointmentFields
> &
  AppointmentFields;

export const Appointment = model<AppointmentFields>(
  'Appointment',
  appointmentSchema,
);