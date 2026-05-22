const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const { AppError } = require('../utils/errors');

function buildAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      sessionVersion: user.sessionVersion ?? 0,
    },
    env.jwtSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOpaqueToken() {
  return crypto.randomBytes(48).toString('hex');
}

async function createRefreshToken(user, context = {}) {
  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.jwtRefreshExpiresIn));

  await RefreshToken.create({
    tokenHash,
    userId: user._id.toString(),
    expiresAt,
    createdByIp: context.ip || null,
    userAgent: context.userAgent || '',
  });

  return { token: rawToken, expiresAt };
}

function parseDurationMs(value) {
  if (typeof value === 'number') return value;
  const input = String(value || '').trim();
  const match = input.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * multipliers[unit];
}

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  };
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

async function loginUser(email, password, context = {}) {
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
  const refreshToken = await createRefreshToken(user, context);

  return {
    accessToken: buildAccessToken(user),
    refreshToken: refreshToken.token,
    user: toPublicUser(user),
  };
}

async function verifyToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.active) {
      throw new AppError(401, 'Unauthorized');
    }
    if ((user.sessionVersion ?? 0) !== (payload.sessionVersion ?? 0)) {
      throw new AppError(401, 'Session expired');
    }
    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'Unauthorized');
  }
}

async function refreshAccessToken(refreshToken, context = {}) {
  const tokenHash = hashToken(String(refreshToken || ''));
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Invalid refresh token');
  }

  const user = await User.findById(stored.userId);
  if (!user || !user.active) {
    throw new AppError(401, 'Unauthorized');
  }

  const nextRefresh = await createRefreshToken(user, context);
  stored.revokedAt = new Date();
  stored.replacedByTokenHash = hashToken(nextRefresh.token);
  await stored.save();

  return {
    accessToken: buildAccessToken(user),
    refreshToken: nextRefresh.token,
    user: toPublicUser(user),
  };
}

async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(String(refreshToken));
  const stored = await RefreshToken.findOne({ tokenHash });
  if (stored && !stored.revokedAt) {
    stored.revokedAt = new Date();
    await stored.save();
  }
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const matches = await bcrypt.compare(String(currentPassword || ''), user.passwordHash);
  if (!matches) throw new AppError(400, 'Current password is incorrect');

  user.passwordHash = await bcrypt.hash(String(newPassword || ''), 12);
  user.sessionVersion += 1;
  await user.save();
  await RefreshToken.updateMany({ userId: user._id.toString(), revokedAt: null }, { $set: { revokedAt: new Date() } });
  return toPublicUser(user);
}

async function startPasswordReset(email) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.active) {
    return { ok: true };
  }

  const rawToken = generateOpaqueToken();
  await PasswordResetToken.create({
    tokenHash: hashToken(rawToken),
    userId: user._id.toString(),
    expiresAt: new Date(Date.now() + env.passwordResetTokenTtlMinutes * 60 * 1000),
  });

  return {
    ok: true,
    ...(env.nodeEnv === 'development' ? { resetToken: rawToken } : {}),
  };
}

async function resetPassword(resetToken, newPassword) {
  const tokenHash = hashToken(String(resetToken || ''));
  const stored = await PasswordResetToken.findOne({ tokenHash });
  if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
    throw new AppError(400, 'Reset token is invalid or expired');
  }

  const user = await User.findById(stored.userId);
  if (!user || !user.active) {
    throw new AppError(404, 'User not found');
  }

  user.passwordHash = await bcrypt.hash(String(newPassword || ''), 12);
  user.sessionVersion += 1;
  await user.save();
  stored.usedAt = new Date();
  await stored.save();
  await RefreshToken.updateMany({ userId: user._id.toString(), revokedAt: null }, { $set: { revokedAt: new Date() } });
  return toPublicUser(user);
}

module.exports = {
  ensureAdminSeeded,
  loginUser,
  verifyToken,
  refreshAccessToken,
  revokeRefreshToken,
  changePassword,
  startPasswordReset,
  resetPassword,
};
