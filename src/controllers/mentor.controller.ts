import type { NextFunction, Request, Response } from 'express';
import type { FilterQuery } from 'mongoose';
import {
  DAYS_OF_WEEK,
  MentorProfile,
  type DayOfWeek,
  type MentorProfileFields,
} from '../models/MentorProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

type AvailabilityInput = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

function normalizeList(value: unknown, fieldName: string): string[] {
  if (
    !Array.isArray(value) ||
    value.some(
      (item) => typeof item !== 'string' || !item.trim(),
    )
  ) {
    throw new AppError(
      `${fieldName} must be an array of non-empty text values`,
      400,
    );
  }

  return [
    ...new Set(
      value.map((item) => item.trim().toLowerCase()),
    ),
  ];
}

function optionalText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined) return undefined;

  if (
    typeof value !== 'string' ||
    value.trim().length > maxLength
  ) {
    throw new AppError(
      `${fieldName} must be text up to ${maxLength} characters`,
      400,
    );
  }

  return value.trim();
}

function parseExperienceYears(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 60
  ) {
    throw new AppError(
      'experienceYears must be a whole number from 0 to 60',
      400,
    );
  }

  return value;
}

function parseAvailability(value: unknown): AvailabilityInput[] {
  if (!Array.isArray(value)) {
    throw new AppError(
      'availability must be an array of time slots',
      400,
    );
  }

  return value.map((slot, index) => {
    if (!slot || typeof slot !== 'object') {
      throw new AppError(
        `availability item ${index + 1} must be an object`,
        400,
      );
    }

    const {
      dayOfWeek,
      startTime,
      endTime,
      isActive = true,
    } = slot as Record<string, unknown>;

    const validTime = (
      time: unknown,
    ): time is string =>
      typeof time === 'string' &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

    if (
      !DAYS_OF_WEEK.includes(dayOfWeek as DayOfWeek)
    ) {
      throw new AppError(
        `availability item ${index + 1} has an invalid dayOfWeek`,
        400,
      );
    }

    if (
      !validTime(startTime) ||
      !validTime(endTime) ||
      startTime >= endTime
    ) {
      throw new AppError(
        `availability item ${index + 1} needs a valid startTime and later endTime in HH:MM format`,
        400,
      );
    }

    if (typeof isActive !== 'boolean') {
      throw new AppError(
        `availability item ${index + 1} isActive must be true or false`,
        400,
      );
    }

    return {
      dayOfWeek: dayOfWeek as DayOfWeek,
      startTime,
      endTime,
      isActive,
    };
  });
}

function profileResponse(
  profile: MentorProfileFields & { _id: unknown },
  mentor?: {
    _id: unknown;
    name: string;
    email: string;
  },
) {
  return {
    id: String(profile._id),
    mentorId: String(profile.user),

    ...(mentor
      ? {
          mentor: {
            id: String(mentor._id),
            name: mentor.name,
            email: mentor.email,
          },
        }
      : {}),

    headline: profile.headline,
    bio: profile.bio,
    skills: profile.skills,
    expertise: profile.expertise,
    experienceYears: profile.experienceYears,
    availability: profile.availability,
  };
}

/**
 * Escapes special regex characters so user input
 * cannot accidentally become a regex pattern.
 */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function createProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (
      await MentorProfile.exists({
        user: req.user!._id,
      })
    ) {
      throw new AppError(
        'A mentor profile already exists. Use the update endpoint instead.',
        409,
      );
    }

    const {
      headline,
      bio,
      skills,
      expertise,
      experienceYears,
    } = req.body as Record<string, unknown>;

    const profile = await MentorProfile.create({
      user: req.user!._id,
      headline:
        optionalText(
          headline,
          'headline',
          120,
        ) ?? '',
      bio:
        optionalText(
          bio,
          'bio',
          1500,
        ) ?? '',
      skills: normalizeList(skills, 'skills'),
      expertise: normalizeList(
        expertise,
        'expertise',
      ),
      experienceYears:
        parseExperienceYears(experienceYears),
    });

    res.status(201).json({
      profile: profileResponse(profile),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile =
      await MentorProfile.findOne({
        user: req.user!._id,
      });

    if (!profile) {
      throw new AppError(
        'Create your mentor profile before updating it',
        404,
      );
    }

    const {
      headline,
      bio,
      skills,
      expertise,
      experienceYears,
    } = req.body as Record<string, unknown>;

    if (headline !== undefined) {
      profile.headline =
        optionalText(
          headline,
          'headline',
          120,
        ) ?? '';
    }

    if (bio !== undefined) {
      profile.bio =
        optionalText(
          bio,
          'bio',
          1500,
        ) ?? '';
    }

    if (skills !== undefined) {
      profile.skills = normalizeList(
        skills,
        'skills',
      );
    }

    if (expertise !== undefined) {
      profile.expertise = normalizeList(
        expertise,
        'expertise',
      );
    }

    if (experienceYears !== undefined) {
      profile.experienceYears =
        parseExperienceYears(
          experienceYears,
        );
    }

    await profile.save();

    res.status(200).json({
      profile: profileResponse(profile),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile =
      await MentorProfile.findOne({
        user: req.user!._id,
      });

    if (!profile) {
      throw new AppError(
        'Mentor profile not found',
        404,
      );
    }

    res.status(200).json({
      profile: profileResponse(profile),
    });
  } catch (error) {
    next(error);
  }
}

export async function replaceAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile =
      await MentorProfile.findOne({
        user: req.user!._id,
      });

    if (!profile) {
      throw new AppError(
        'Create your mentor profile before adding availability',
        404,
      );
    }

    profile.set(
      'availability',
      parseAvailability(
        (req.body as Record<string, unknown>)
          .availability,
      ),
    );

    await profile.save();

    res.status(200).json({
      availability: profile.availability,
    });
  } catch (error) {
    next(error);
  }
}

export async function searchMentors(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      skill,
      expertise,
      minExperience,
      q,
      page = '1',
      limit = '10',
    } = req.query;

    const filter: FilterQuery<MentorProfileFields> =
      {};

    /*
     * CASE-INSENSITIVE SKILL SEARCH
     *
     * This allows:
     * Java
     * java
     * JAVA
     * jAvA
     *
     * to all find the same mentor.
     */
    if (typeof skill === 'string' && skill.trim()) {
      const escapedSkill = escapeRegex(
        skill.trim(),
      );

      filter.skills = {
        $regex: `^${escapedSkill}$`,
        $options: 'i',
      };
    }

    /*
     * CASE-INSENSITIVE EXPERTISE SEARCH
     */
    if (
      typeof expertise === 'string' &&
      expertise.trim()
    ) {
      const escapedExpertise = escapeRegex(
        expertise.trim(),
      );

      filter.expertise = {
        $regex: `^${escapedExpertise}$`,
        $options: 'i',
      };
    }

    /*
     * Minimum experience filter
     */
    if (typeof minExperience === 'string') {
      const years = Number(minExperience);

      if (
        !Number.isInteger(years) ||
        years < 0
      ) {
        throw new AppError(
          'minExperience must be a non-negative whole number',
          400,
        );
      }

      filter.experienceYears = {
        $gte: years,
      };
    }

    /*
     * General text search
     */
    if (
      typeof q === 'string' &&
      q.trim()
    ) {
      const escaped = escapeRegex(
        q.trim(),
      );

      const expression = new RegExp(
        escaped,
        'i',
      );

      filter.$or = [
        {
          headline: expression,
        },
        {
          bio: expression,
        },
        {
          skills: expression,
        },
        {
          expertise: expression,
        },
      ];
    }

    const pageNumber = Math.max(
      1,
      Number(page) || 1,
    );

    const limitNumber = Math.min(
      50,
      Math.max(
        1,
        Number(limit) || 10,
      ),
    );

    const [profiles, total] =
      await Promise.all([
        MentorProfile.find(filter)
          .sort({
            experienceYears: -1,
            createdAt: -1,
          })
          .skip(
            (pageNumber - 1) *
              limitNumber,
          )
          .limit(limitNumber),

        MentorProfile.countDocuments(
          filter,
        ),
      ]);

    const users = await User.find({
      _id: {
        $in: profiles.map(
          (profile) =>
            profile.user,
        ),
      },
    }).select('name email');

    const usersById = new Map(
      users.map((user) => [
        String(user._id),
        user,
      ]),
    );

    res.status(200).json({
      results: profiles.map(
        (profile) =>
          profileResponse(
            profile,
            usersById.get(
              String(profile.user),
            ),
          ),
      ),

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(
          total / limitNumber,
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMentorProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const mentor =
      await User.findOne({
        _id: req.params.mentorId,
        role: 'mentor',
      }).select('name email');

    const profile = mentor
      ? await MentorProfile.findOne({
          user: mentor._id,
        })
      : null;

    if (!profile || !mentor) {
      throw new AppError(
        'Mentor profile not found',
        404,
      );
    }

    res.status(200).json({
      profile: profileResponse(
        profile,
        mentor,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMentorAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile =
      await MentorProfile.findOne({
        user: req.params.mentorId,
      });

    if (!profile) {
      throw new AppError(
        'Mentor profile not found',
        404,
      );
    }

    res.status(200).json({
      mentorId: String(
        profile.user,
      ),
      availability:
        profile.availability.filter(
          (slot) => slot.isActive,
        ),
    });
  } catch (error) {
    next(error);
  }
}