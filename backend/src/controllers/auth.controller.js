const { AppError } = require('../utils/errors');
const {
  changePassword,
  loginUser,
  refreshAccessToken,
  resetPassword,
  revokeRefreshToken,
  startPasswordReset,
} = require('../services/auth.service');
const { writeAuditLog } = require('../services/audit-log.service');

async function loginController(request, response) {
  const { email, password } = request.body || {};

  if (!email || !password) {
    throw new AppError(400, 'email and password are required');
  }

  const result = await loginUser(email, password, {
    ip: request.ip,
    userAgent: request.get('user-agent') || '',
  });
  await writeAuditLog({
    actorUserId: result.user.id,
    actorEmail: result.user.email,
    action: 'auth.login',
    targetType: 'user',
    targetId: result.user.id,
    ip: request.ip,
    metadata: { role: result.user.role },
  });
  response.json({ ok: true, ...result });
}

async function refreshController(request, response) {
  const result = await refreshAccessToken(request.body?.refreshToken, {
    ip: request.ip,
    userAgent: request.get('user-agent') || '',
  });
  response.json({ ok: true, ...result });
}

async function meController(request, response) {
  response.json({
    ok: true,
    user: {
      id: request.user._id.toString(),
      name: request.user.name,
      email: request.user.email,
      role: request.user.role,
      active: request.user.active,
      mustChangePassword: request.user.mustChangePassword ?? false,
      onboardingEmailSentAt: request.user.onboardingEmailSentAt ?? null,
    },
  });
}

async function logoutController(request, response) {
  await revokeRefreshToken(request.body?.refreshToken);
  await writeAuditLog({
    actorUserId: request.user._id.toString(),
    actorEmail: request.user.email,
    action: 'auth.logout',
    targetType: 'user',
    targetId: request.user._id.toString(),
    ip: request.ip,
  });
  response.json({ ok: true });
}

async function changePasswordController(request, response) {
  const user = await changePassword(request.user._id.toString(), request.body?.currentPassword, request.body?.newPassword);
  await writeAuditLog({
    actorUserId: request.user._id.toString(),
    actorEmail: request.user.email,
    action: 'auth.change-password',
    targetType: 'user',
    targetId: user.id,
    ip: request.ip,
  });
  response.json({ ok: true, user });
}

async function forgotPasswordController(request, response) {
  const result = await startPasswordReset(request.body?.email);
  response.json({ ok: true, ...result });
}

async function resetPasswordController(request, response) {
  const user = await resetPassword(request.body?.resetToken, request.body?.newPassword);
  await writeAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    action: 'auth.reset-password',
    targetType: 'user',
    targetId: user.id,
    ip: request.ip,
  });
  response.json({ ok: true });
}

module.exports = {
  loginController,
  refreshController,
  meController,
  logoutController,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
};
