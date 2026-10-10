import { beforeAll, describe, expect, it } from 'vitest';

let createAccessToken: (payload: { userId: string; role: 'mentor' | 'mentee' }) => string;
let verifyAccessToken: (token: string) => { userId: string; role: 'mentor' | 'mentee' };

beforeAll(async () => {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/peer-mentorship-test';
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough-to-be-safe';
  ({ createAccessToken, verifyAccessToken } = await import('../src/utils/jwt.js'));
});

describe('JWT helpers', () => {
  it('signs and verifies the authenticated user identity and role', () => {
    const token = createAccessToken({ userId: 'user-123', role: 'mentor' });

    expect(verifyAccessToken(token)).toMatchObject({ userId: 'user-123', role: 'mentor' });
  });
});
