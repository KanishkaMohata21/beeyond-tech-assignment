import { Router } from 'express';
import { register, login, refreshToken, getProfile } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/me', authMiddleware, getProfile);

export default router;
