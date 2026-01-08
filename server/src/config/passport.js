import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import AzureAdOAuth2Strategy from 'passport-azure-ad-oauth2';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';

dotenv.config();

function signJwt(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// new helper functions to get user info from Microsoft Graph API
function pickFirstNonEmpty(...vals) {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

async function fetchMicrosoftMe(accessToken) {
  const resp = await axios.get(
    'https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName,givenName,surname',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return resp.data;
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

/* old Microsoft strategy that does not fetch user info 
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
*/

// Microsoft / Azure AD strategy (robust: decode id_token claims + Graph fallback)
passport.use(
  new AzureAdOAuth2Strategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL,
      tenant: process.env.MICROSOFT_TENANT || 'common',
      // Ensures the access token is usable for Microsoft Graph (so we can call /me when claims are missing)
      resource: 'https://graph.microsoft.com'
    },
    async (accessToken, refreshToken, params, profile, done) => {
      try {
        // passport-azure-ad-oauth2 returns user identity claims inside params.id_token (a JWT).
        const claims = params?.id_token ? jwt.decode(params.id_token) : {};

        const oid = pickFirstNonEmpty(
          claims?.oid,
          claims?.sub,
          params?.oid,
          params?.sub
        );

        // Email is NOT guaranteed to be present as a dedicated claim.
        // These are common candidates across tenants/account types:
        let email = pickFirstNonEmpty(
          claims?.preferred_username,
          claims?.upn,
          claims?.email,
          claims?.unique_name,
          params?.upn,
          params?.preferred_username
        );

        let name = pickFirstNonEmpty(
          claims?.name,
          `${claims?.given_name || ''} ${claims?.family_name || ''}`.trim(),
          params?.name,
          email
        );

        // Fallback: call Microsoft Graph /me to get mail/userPrincipalName + displayName
        if ((!email || !name) && accessToken) {
          try {
            const me = await fetchMicrosoftMe(accessToken);
            email = email || pickFirstNonEmpty(me.mail, me.userPrincipalName);
            name = name || pickFirstNonEmpty(
              me.displayName,
              `${me.givenName || ''} ${me.surname || ''}`.trim()
            );
          } catch (e) {
            // If Graph call fails (missing permissions/resource), we'll continue with whatever we have.
          }
        }

        if (!email) {
          return done(
            new Error(
              'Microsoft login did not return an email/userPrincipalName. ' +
              'Add optional claims in Entra ID (email/upn) or grant Microsoft Graph User.Read and include it in the auth flow.'
            ),
            null
          );
        }
        if (!name) name = email;

        // Prefer matching by provider+providerId when we have an oid/sub
        let user = oid ? await User.findOne({ provider: 'microsoft', providerId: oid }) : null;

        // If not found, fall back to matching by email (lets a user "link" accounts)
        if (!user && email) {
          user = await User.findOne({ email });
        }

        if (!user) {
          user = await User.create({
            name,
            email,
            provider: 'microsoft',
            providerId: oid || email, // last-resort to avoid null providerId
            role: 'board'
          });
        } else {
          // Keep providerId in sync if missing
          if (oid && user.provider === 'microsoft' && !user.providerId) {
            user.providerId = oid;
            await user.save();
          }
          // Optionally fill missing name
          if (!user.name && name) {
            user.name = name;
            await user.save();
          }
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
