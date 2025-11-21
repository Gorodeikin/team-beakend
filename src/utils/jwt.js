import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment variables');
}

export const ACCESS_TOKEN_TTL = 15 * 60; // 15 минут
export const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60;

export function signToken(payload, expiresInSeconds) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresInSeconds,
  });
}

export function verifyAcessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw createHttpError(401, 'Invalid or expired token');
  }
}
