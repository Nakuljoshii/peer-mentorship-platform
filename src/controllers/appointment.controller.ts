import type { NextFunction, Request, Response } from 'express';
import { Appointment, APPOINTMENT_STATUSES, type AppointmentStatus } from '../models/Appointment.js';
import { MentorProfile } from '../models/MentorProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { createNotification } from '../utils/notifications.js';

const TIME_ZONE = process.env.APPOINTMENT_TIME_ZONE ?? 'Asia/Kolkata';

function parseDate(value: unknown, fieldName: string): Date {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid ISO date/time`, 400);
  }

  return date;
}

function getDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return {
    dayOfWeek: values.weekday.toLowerCase(),
    time: `${values.hour}:${values.minute}`,
  };
}

function isInsideAvailability(
  startTime: Date,
  endTime: Date,
  availability: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[],
): boolean {
  const startParts = getDateParts(startTime);
  const endParts = getDateParts(endTime);

  // An appointment must remain on the same calendar day.
  if (startParts.dayOfWeek !== endParts.dayOfWeek) {
    return false;
  }

  return availability.some(
    (slot) =>
      slot.isActive &&
      slot.dayOfWeek === startParts.dayOfWeek &&
      slot.startTime <= startParts.time &&
      slot.endTime >= endParts.time,
  );
}

function appointmentResponse(appointment: any) {
  return {
    id: String(appointment._id),
    mentee:
      appointment.mentee && appointment.mentee._id
        ? {
            id: String(appointment.mentee._id),
            name: appointment.mentee.name,
            email: appointment.mentee.email,
          }
        : String(appointment.mentee),
    mentor:
      appointment.mentor && appointment.mentor._id
        ? {
            id: String(appointment.mentor._id),
            name: appointment.mentor.name,
            email: appointment.mentor.email,
          }
        : String(appointment.mentor),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    notes: appointment.notes,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
}

export async function createAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { mentorId, startTime: startTimeInput, endTime: endTimeInput, notes = '' } =
      req.body as Record<string, unknown>;

    if (typeof mentorId !== 'string' || !mentorId.trim()) {
      throw new AppError('mentorId is required', 400);
    }

    if (typeof notes !== 'string' || notes.length > 1000) {
      throw new AppError('notes must be text up to 1000 characters', 400);
    }

    const startTime = parseDate(startTimeInput, 'startTime');
    const endTime = parseDate(endTimeInput, 'endTime');

    if (startTime <= new Date()) {
      throw new AppError('Appointment start time must be in the future', 400);
    }

    if (endTime <= startTime) {
      throw new AppError('endTime must be later than startTime', 400);
    }

    const mentor = await User.findOne({
      _id: mentorId,
      role: 'mentor',
    }).select('_id name email');

    if (!mentor) {
      throw new AppError('Mentor not found', 404);
    }

    if (String(mentor._id) === String(req.user!._id)) {
      throw new AppError('A mentor cannot book an appointment with themselves', 400);
    }

    const mentorProfile = await MentorProfile.findOne({
      user: mentor._id,
    });

    if (!mentorProfile) {
      throw new AppError('This mentor does not have a mentor profile', 404);
    }

    if (
      !isInsideAvailability(
        startTime,
        endTime,
        mentorProfile.availability,
      )
    ) {
      throw new AppError(
        'The requested time is outside the mentor availability',
        409,
      );
    }

    // Prevent overlapping appointments for this mentor.
    const conflictingAppointment = await Appointment.findOne({
      mentor: mentor._id,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflictingAppointment) {
      throw new AppError(
        'The mentor is already booked for the requested time',
        409,
      );
    }

    // Also prevent the mentee from booking overlapping appointments.
    const menteeConflict = await Appointment.findOne({
      mentee: req.user!._id,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (menteeConflict) {
      throw new AppError(
        'You already have another appointment during this time',
        409,
      );
    }

    const appointment = await Appointment.create({
      mentee: req.user!._id,
      mentor: mentor._id,
      startTime,
      endTime,
      status: 'PENDING',
      notes: notes.trim(),
    });

    await createNotification(mentor._id, 'APPOINTMENT_CREATED', 'A mentee booked a new appointment', appointment._id);

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('mentee', 'name email')
      .populate('mentor', 'name email');

    res.status(201).json({
      appointment: appointmentResponse(populatedAppointment),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAppointments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointments = await Appointment.find({
      $or: [
        { mentee: req.user!._id },
        { mentor: req.user!._id },
      ],
    })
      .populate('mentee', 'name email')
      .populate('mentor', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      appointments: appointments.map(appointmentResponse),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('mentee', 'name email')
      .populate('mentor', 'name email');

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    const isParticipant =
      String(appointment.mentee._id ?? appointment.mentee) ===
        String(req.user!._id) ||
      String(appointment.mentor._id ?? appointment.mentor) ===
        String(req.user!._id);

    if (!isParticipant) {
      throw new AppError(
        'You do not have permission to view this appointment',
        403,
      );
    }

    res.status(200).json({
      appointment: appointmentResponse(appointment),
    });
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingAppointments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointments = await Appointment.find({
      $or: [
        { mentee: req.user!._id },
        { mentor: req.user!._id },
      ],
      startTime: { $gte: new Date() },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    })
      .populate('mentee', 'name email')
      .populate('mentor', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      appointments: appointments.map(appointmentResponse),
    });
  } catch (error) {
    next(error);
  }
}

export async function getPastAppointments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
  const appointments = await Appointment.find({
  $and: [
    {
      $or: [
        { mentee: req.user!._id },
        { mentor: req.user!._id },
      ],
    },
    {
      $or: [
        { startTime: { $lt: new Date() } },
        { status: { $in: ['COMPLETED', 'CANCELLED'] } },
      ],
    },
  ],
})
      .populate('mentee', 'name email')
      .populate('mentor', 'name email')
      .sort({ startTime: -1 });

    res.status(200).json({
      appointments: appointments.map(appointmentResponse),
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (String(appointment.mentor) !== String(req.user!._id)) {
      throw new AppError(
        'Only the mentor can confirm this appointment',
        403,
      );
    }

    if (appointment.status !== 'PENDING') {
      throw new AppError(
        `Cannot confirm an appointment with status ${appointment.status}`,
        409,
      );
    }

    appointment.status = 'CONFIRMED';
    await appointment.save();
    await createNotification(appointment.mentee, 'APPOINTMENT_CONFIRMED', 'Your appointment was confirmed', appointment._id);

    res.status(200).json({
      message: 'Appointment confirmed',
      appointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    const isParticipant =
      String(appointment.mentor) === String(req.user!._id) ||
      String(appointment.mentee) === String(req.user!._id);

    if (!isParticipant) {
      throw new AppError(
        'You do not have permission to cancel this appointment',
        403,
      );
    }

    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      throw new AppError(
        `Cannot cancel an appointment with status ${appointment.status}`,
        409,
      );
    }

    appointment.status = 'CANCELLED';
    await appointment.save();
    const otherParticipant = String(appointment.mentor) === String(req.user!._id) ? appointment.mentee : appointment.mentor;
    await createNotification(otherParticipant, 'APPOINTMENT_CANCELLED', 'An appointment was cancelled', appointment._id);

    res.status(200).json({
      message: 'Appointment cancelled',
      appointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (String(appointment.mentor) !== String(req.user!._id)) {
      throw new AppError(
        'Only the mentor can complete this appointment',
        403,
      );
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new AppError(
        `Only confirmed appointments can be completed`,
        409,
      );
    }

    if (appointment.endTime > new Date()) {
      throw new AppError(
        'An appointment cannot be completed before its end time',
        409,
      );
    }

    appointment.status = 'COMPLETED';
    await appointment.save();

    res.status(200).json({
      message: 'Appointment completed',
      appointment,
    });
  } catch (error) {
    next(error);
  }
}