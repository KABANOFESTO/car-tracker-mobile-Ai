const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const { sendProvisioningEmail } = require('./email.service');
const { generateTemporaryPassword } = require('./password.service');

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    mustChangePassword: user.mustChangePassword ?? false,
    onboardingEmailSentAt: user.onboardingEmailSentAt ?? null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function listUsers() {
  const users = await User.find().sort({ createdAt: -1 });
  return users.map(toPublicUser);
}

async function createUser(payload) {
  const existing = await User.findOne({ email: payload.email.toLowerCase().trim() });
  if (existing) {
    throw new AppError(409, 'A user with this email already exists');
  }

  const temporaryPassword = String(payload.password || '').trim() || generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const user = await User.create({
    name: payload.name.trim(),
    email: payload.email.toLowerCase().trim(),
    passwordHash,
    role: payload.role,
    active: payload.active ?? true,
    mustChangePassword: true,
  });

  try {
    await sendProvisioningEmail({
      name: user.name,
      email: user.email,
      password: temporaryPassword,
      role: user.role,
    });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }

  user.onboardingEmailSentAt = new Date();
  await user.save();

  return {
    user: toPublicUser(user),
    credentialDelivery: {
      recipient: user.email,
      sentAt: user.onboardingEmailSentAt.toISOString(),
      method: 'smtp',
    },
  };
}

async function updateUser(userId, payload) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (payload.name != null) user.name = payload.name.trim();
  if (payload.role != null) user.role = payload.role;
  if (payload.active != null) user.active = payload.active;
  if (payload.password) {
    user.passwordHash = await bcrypt.hash(payload.password, 12);
    user.mustChangePassword = true;
  }

  await user.save();
  return toPublicUser(user);
}

module.exports = { listUsers, createUser, updateUser };
