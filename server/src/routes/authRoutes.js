import express from "express";
import passport from "passport";
import { register, login, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import "../config/passport.js";

const router = express.Router();

function describeOAuthError(err, info) {
  const details = {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    errno: err?.errno,
    syscall: err?.syscall,
    hostname: err?.hostname,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL,
    tenant: process.env.MICROSOFT_TENANT || "common",
    node: process.version,
    // Some Passport strategies include additional context in `info`
    info: info || undefined,
  };

  // passport-oauth2 wraps token-exchange failures in InternalOAuthError
  const oauthError = err?.oauthError;
  if (oauthError) {
    details.oauthErrorName = oauthError.name;
    details.oauthStatusCode = oauthError.statusCode;
    details.oauthCode = oauthError.code;
    details.oauthErrno = oauthError.errno;
    details.oauthSyscall = oauthError.syscall;
    details.oauthHostname = oauthError.hostname;
    details.oauthMessage = oauthError.message;
    details.oauthString = String(oauthError);

    // Extract useful own props from Error instances (JSON.stringify(Error) => {})
    try {
      const props = {};
      for (const k of Object.getOwnPropertyNames(oauthError)) {
        if (k === "stack") continue;
        const v = oauthError[k];
        if (v === undefined) continue;
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          props[k] = v;
        } else if (v && typeof v === "object") {
          props[k] = String(v);
        } else {
          props[k] = v;
        }
      }
      if (Object.keys(props).length) details.oauthProps = props;
    } catch {
      // ignore
    }

    if (oauthError.stack) {
      details.oauthStackFirstLine = String(oauthError.stack).split("\n")[0];
    }

    if (oauthError.data) {
      try {
        details.oauthData =
          typeof oauthError.data === "string"
            ? oauthError.data
            : oauthError.data.toString();
      } catch {
        // ignore
      }
    }
  }

  // Some implementations attach response data directly
  if (err?.data) {
    try {
      details.data = typeof err.data === "string" ? err.data : err.data.toString();
    } catch {
      // ignore
    }
  }

  if (err?.stack) {
    details.stackFirstLine = String(err.stack).split("\n")[0];
  }

  return details;
}

// Local auth
router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const token = req.user.jwt;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    res.redirect(
      `${clientUrl}/social-login?token=${encodeURIComponent(
        token
      )}&provider=google`
    );
  }
);

// Microsoft OAuth
router.get("/microsoft", passport.authenticate("azure_ad_oauth2"));

// Use a custom callback so we can surface the real Azure error (AADSTS...) when token exchange fails.
router.get("/microsoft/callback", (req, res, next) => {
  passport.authenticate(
    "azure_ad_oauth2",
    { session: false },
    (err, user, info) => {
      if (err) {
        const details = describeOAuthError(err, info);
        console.error("Microsoft OAuth failed:", details);

        // In local/dev, return the details so you can immediately see the AADSTS code.
        if (process.env.NODE_ENV !== "production") {
          return res
            .status(500)
            .type("text/plain")
            .send(`Microsoft OAuth failed during token exchange.\n\n${JSON.stringify(details, null, 2)}`);
        }

        return res.redirect("/");
      }

      if (!user) {
        return res.redirect("/");
      }

      const token = user.jwt;
      const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
      return res.redirect(
        `${clientUrl}/social-login?token=${encodeURIComponent(
          token
        )}&provider=microsoft`
      );
    }
  )(req, res, next);
});

export default router;
