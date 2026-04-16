const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { User } = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { env } = require("../config/env");

const router = express.Router();

const authSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

function buildToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    env.jwtSecret,
    { expiresIn: "7d" },
  );
}

router.post(
  "/register",
  asyncHandler(async (request, response) => {
    const payload = authSchema.extend({
      name: z.string().trim().min(2).max(80),
    }).parse(request.body);

    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      return response.status(409).json({ message: "Email already in use." });
    }

    const passwordHash = await bcrypt.hash(payload.password, env.saltRounds);
    const user = await User.create({
      name: payload.name,
      email: payload.email,
      passwordHash,
    });

    const token = buildToken(user);
    return response.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (request, response) => {
    const payload = authSchema.pick({ email: true, password: true }).parse(
      request.body,
    );

    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return response.status(401).json({ message: "Invalid credentials." });
    }

    const passwordMatches = await bcrypt.compare(
      payload.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return response.status(401).json({ message: "Invalid credentials." });
    }

    const token = buildToken(user);
    return response.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  }),
);

module.exports = { authRouter: router };
