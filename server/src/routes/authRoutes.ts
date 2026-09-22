import express from 'express';
import rateLimit from 'express-rate-limit';
import { loginUser, getMe, changePassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
  message: { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts, please try again after 15 minutes' } },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, loginUser);
router.post('/change-password', protect, changePassword);

router.get('/me', protect, getMe);

export default router;
