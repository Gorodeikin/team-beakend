import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import {
  signToken,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from '../utils/jwt.js';

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw createHttpError(409, 'Email in use');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    avatarUrl: null,
    description: '',
    articlesAmount: 0,
  });

  return user;
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw createHttpError(401, 'Invalid credentials');
  }

  await Session.deleteMany({ userId: user._id });

  const accessToken = signToken({ userId: user._id }, ACCESS_TOKEN_TTL);
  const refreshToken = signToken({ userId: user._id }, REFRESH_TOKEN_TTL);

  const accessValidUntil = new Date(Date.now() + ACCESS_TOKEN_TTL * 1000);
  const refreshValidUntil = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

  const session = await Session.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: accessValidUntil,
    refreshTokenValidUntil: refreshValidUntil,
  });

  const { password: _, ...safeUser } = user.toObject();

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
}

export async function logoutUser(refreshToken) {
  if (!refreshToken) return;

  await Session.deleteOne({ refreshToken });
}

export async function refreshTokens(refreshToken) {
  if (!refreshToken) {
    throw createHttpError(401, 'Refresh token missing');
  }

  const session = await Session.findOne({ refreshToken });
  if (!session) {
    throw createHttpError(401, 'Invalid refresh token');
  }

  if (new Date() > session.refreshTokenValidUntil) {
    await Session.deleteOne({ _id: session._id });
    throw createHttpError(401, 'Refresh token expired');
  }

  const userId = session.userId;

  const newAccessToken = signToken({ userId }, ACCESS_TOKEN_TTL);
  const newRefreshToken = signToken({ userId }, REFRESH_TOKEN_TTL);

  session.accessToken = newAccessToken;
  session.refreshToken = newRefreshToken;
  session.accessTokenValidUntil = new Date(
    Date.now() + ACCESS_TOKEN_TTL * 1000
  );
  session.refreshTokenValidUntil = new Date(
    Date.now() + REFRESH_TOKEN_TTL * 1000
  );

  await session.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    userId,
  };
}
