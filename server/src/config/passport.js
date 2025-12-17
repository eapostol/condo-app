import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import AzureAdOAuth2Strategy from 'passport-azure-ad-oauth2';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

dotenv.config();

function signJwt(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        let user = await User.findOne({ provider: 'google', providerId: profile.id });
        if (!user && email) {
          user = await User.findOne({ email });
        }
        if (!user) {
          user = await User.create({
            name,
            email,
            provider: 'google',
            providerId: profile.id,
            role: 'manager'
          });
        }
        const jwtToken = signJwt(user);
        const safeUser = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          jwt: jwtToken
        };
        return done(null, safeUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Microsoft / Azure AD strategy (simplified demo)
passport.use(
  new AzureAdOAuth2Strategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL,
      tenant: process.env.MICROSOFT_TENANT || 'common'
    },
    async (accessToken, refreshToken, params, profile, done) => {
      try {
        const oid = params.oid || params.sub;
        const email = params.upn || params.preferred_username;
        const name = params.name || email;
        let user = await User.findOne({ provider: 'microsoft', providerId: oid });
        if (!user && email) {
          user = await User.findOne({ email });
        }
        if (!user) {
          user = await User.create({
            name,
            email,
            provider: 'microsoft',
            providerId: oid,
            role: 'board'
          });
        }
        const jwtToken = signJwt(user);
        const safeUser = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          jwt: jwtToken
        };
        return done(null, safeUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});
