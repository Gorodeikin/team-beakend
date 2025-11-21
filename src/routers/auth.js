import { Router } from 'express';
import { registerSchema, loginSchema } from '../validation/auth.js';
import { validateBody } from '../middlewares/validateBody.js';

import {
  registerController,
  loginController,
  refreshController,
  logoutController,
} from '../controllers/auth.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), registerController);

authRouter.post('/login', validateBody(loginSchema), loginController);

authRouter.post('/refresh', refreshController);

authRouter.post('/logout', logoutController);

export default authRouter;
