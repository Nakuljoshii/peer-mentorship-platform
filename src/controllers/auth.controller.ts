import bcrypt from 'bcrypt';
import type { Request, Response, NextFunction } from 'express';
import { User, USER_ROLES, type UserRole } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { createAccessToken } from '../utils/jwt.js';

const PASSWORD_MIN_LENGTH = 8;

function userResponse(user: { _id: unknown; name: string; email: string; role: UserRole }) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role } = req.body as Record<string, unknown>;

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !USER_ROLES.includes(role as UserRole)) {
      throw new AppError('name, email, password, and a role of mentor or mentee are required', 400);
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new AppError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.exists({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: normalizedEmail, password: hashedPassword, role });
    const token = createAccessToken({ userId: user.id, role: user.role });

    res.status(201).json({ token, user: userResponse(user) });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as Record<string, unknown>;
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new AppError('email and password are required', 400);
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = createAccessToken({ userId: user.id, role: user.role });
    res.status(200).json({ token, user: userResponse(user) });
  } catch (error) {
    next(error);
  }
}

export function getCurrentUser(req: Request, res: Response): void {
  res.status(200).json({ user: userResponse(req.user!) });
}

// A minimal protected endpoint that demonstrates the reusable role middleware.
export function getMentorArea(_req: Request, res: Response): void {
  res.status(200).json({ message: 'Welcome to the mentor-only area' });
}
