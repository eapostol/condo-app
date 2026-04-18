// @ts-check
// @ts-ignore - package has no bundled types in this repo's current setup
import bcrypt from "bcryptjs";
// @ts-ignore - package has no bundled types in this repo's current setup
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

/** @typedef {import("../../../shared/contracts/auth.js").ApiMessageResponse} ApiMessageResponse */
/** @typedef {import("../../../shared/contracts/auth.js").AuthMeResponse} AuthMeResponse */
/** @typedef {import("../../../shared/contracts/auth.js").AuthSessionUser} AuthSessionUser */
/** @typedef {import("../../../shared/contracts/auth.js").AuthSuccessResponse} AuthSuccessResponse */
/** @typedef {import("../../../shared/contracts/auth.js").JwtSessionPayload} JwtSessionPayload */

/**
 * @param {any} user
 * @returns {AuthSessionUser}
 */
function toSessionUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    role: user.role,
    email: user.email,
    provider: user.provider || "local",
  };
}

/**
 * @param {any} user
 * @returns {AuthMeResponse}
 */
function toAuthMeResponse(user) {
  return {
    user: /** @type {any} */ (user),
  };
}

/**
 * @param {any} user
 * @returns {string}
 */
function signToken(user) {
  /** @type {JwtSessionPayload} */
  const payload = {
    id: String(user._id),
    role: user.role,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(
    payload,
    /** @type {string} */ (process.env.JWT_SECRET),
    { expiresIn: "8h" }
  );
}

/**
 * @param {any} req
 * @param {any} res
 */
export async function register(req, res) {
  try {
    const { name, email, username, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json(/** @type {ApiMessageResponse} */ ({ message: "Email already in use" }));
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      username,
      passwordHash: hash,
      role: role || "resident",
      provider: "local",
    });
    const token = signToken(user);
    /** @type {AuthSuccessResponse} */
    const payload = {
      token,
      user: toSessionUser(user),
    };
    res.status(201).json(payload);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(/** @type {ApiMessageResponse} */ ({ message: "Registration failed" }));
  }
}

/**
 * @param {any} req
 * @param {any} res
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res
        .status(401)
        .json(/** @type {ApiMessageResponse} */ ({ message: "Invalid credentials" }));
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res
        .status(401)
        .json(/** @type {ApiMessageResponse} */ ({ message: "Invalid credentials" }));
    }
    const token = signToken(user);
    /** @type {AuthSuccessResponse} */
    const payload = {
      token,
      user: toSessionUser(user),
    };
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json(/** @type {ApiMessageResponse} */ ({ message: "Login failed" }));
  }
}

/**
 * @param {any} req
 * @param {any} res
 */
export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) {
      return res
        .status(404)
        .json(/** @type {ApiMessageResponse} */ ({ message: "User not found" }));
    }
    res.json(toAuthMeResponse(user));
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(/** @type {ApiMessageResponse} */ ({ message: "Failed to load user" }));
  }
}
