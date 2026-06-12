const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FleetState = require('../models/FleetState');
const RefreshToken = require('../models/RefreshToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const PushToken = require('../models/PushToken');
const { AppError } = require('../utils/errors');
const { isEmailConfigured, sendProvisioningEmail } = require('./email.service');
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

  let credentialDelivery;

  if (isEmailConfigured()) {
    try {
      await sendProvisioningEmail({
        name: user.name,
        email: user.email,
        password: temporaryPassword,
        role: user.role,
      });

      user.onboardingEmailSentAt = new Date();
      await user.save();

      credentialDelivery = {
        recipient: user.email,
        sentAt: user.onboardingEmailSentAt.toISOString(),
        method: 'smtp',
      };
    } catch (error) {
      console.error('[user.create] provisioning email failed', error);
      credentialDelivery = {
        recipient: user.email,
        sentAt: new Date().toISOString(),
        method: 'manual',
        warning: 'SMTP delivery failed. Share the temporary credentials manually and check backend SMTP settings.',
      };
    }
  } else {
    credentialDelivery = {
      recipient: user.email,
      sentAt: new Date().toISOString(),
      method: 'manual',
      warning: 'Email delivery is not configured. Share the temporary credentials with the user manually.',
    };
  }

  return {
    user: toPublicUser(user),
    temporaryPassword,
    credentialDelivery,
  };
}

async function updateUser(userId, payload, actorUserId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user._id.toString() === String(actorUserId) && payload.active === false) {
    throw new AppError(400, 'You cannot disable your own account');
  }

  const nextRole = payload.role ?? user.role;
  const nextActive = payload.active ?? user.active;
  const wouldRemainAdmin = nextRole === 'admin' && nextActive !== false;
  if (user.role === 'admin' && !wouldRemainAdmin) {
    const otherActiveAdmins = await User.countDocuments({
      role: 'admin',
      active: true,
      _id: { $ne: user._id },
    });
    if (otherActiveAdmins === 0) {
      throw new AppError(400, 'At least one active admin must remain');
    }
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

async function deleteUser(userId, actorUserId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user._id.toString() === String(actorUserId)) {
    throw new AppError(400, 'You cannot delete your own account');
  }

  if (user.role === 'admin') {
    const otherActiveAdmins = await User.countDocuments({
      role: 'admin',
      active: true,
      _id: { $ne: user._id },
    });
    if (otherActiveAdmins === 0) {
      throw new AppError(400, 'At least one active admin must remain');
    }
  }

  const deletedUser = toPublicUser(user);
  await Promise.all([
    RefreshToken.deleteMany({ userId: user._id.toString() }),
    PasswordResetToken.deleteMany({ userId: user._id.toString() }),
    PushToken.deleteMany({ ownerUserId: user._id.toString() }),
    FleetState.deleteMany({ ownerUserId: user._id.toString() }),
    User.deleteOne({ _id: user._id }),
  ]);

  return deletedUser;
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
