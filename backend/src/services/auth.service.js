const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { AppError } = require('../utils/errors');

function buildToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function ensureAdminSeeded() {
  const email = env.adminEmail.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(env.adminPassword, 12);
  return User.create({
    name: env.adminName,
    email,
    passwordHash,
    role: 'admin',
    active: true,
  });
}

async function loginUser(email, password) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.active) {
    throw new AppError(401, 'Invalid email or password');
  }

  const matches = await bcrypt.compare(String(password || ''), user.passwordHash);
  if (!matches) {
    throw new AppError(401, 'Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: buildToken(user),
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async function verifyToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.active) {
      throw new AppError(401, 'Unauthorized');
    }
    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'Unauthorized');
  }
}

module.exports = { ensureAdminSeeded, loginUser, verifyToken };
