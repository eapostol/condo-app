import express from 'express';
import passport from 'passport';
import { register, login, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import '../config/passport.js';

const router = express.Router();

// Local auth
router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const token = req.user.jwt;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/social-login?token=${token}`);
  }
);

// Microsoft OAuth
router.get('/microsoft', passport.authenticate('azure_ad_oauth2'));

router.get(
  '/microsoft/callback',
  passport.authenticate('azure_ad_oauth2', {
    session: false,
    failureRedirect: '/'
  }),
  (req, res) => {
    const token = req.user.jwt;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/social-login?token=${token}`);
  }
);

export default router;
