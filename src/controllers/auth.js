import createHttpError from 'http-errors';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokens,
} from '../services/auth.js';
import { setRefreshCookie, clearRefreshCookie } from '../utils/cookies.js';

export const registerController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser({ name, email, password });

    const {
      user: safeUser,
      accessToken,
      refreshToken,
    } = await loginUser({
      email: user.email,
      password: req.body.password,
    });

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      status: 201,
      message: 'User registered',
      data: {
        user: safeUser,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const loginController = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await loginUser(req.body);

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      status: 200,
      message: 'Login successful',
      data: {
        user,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refreshController = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies || {};

    if (!refreshToken) {
      throw createHttpError(401, 'No refresh token provided');
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      userId,
    } = await refreshTokens(refreshToken);

    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      status: 200,
      message: 'Token refreshed',
      data: {
        accessToken,
        userId,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logoutController = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies || {};

    await logoutUser(refreshToken);

    clearRefreshCookie(res);

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};
