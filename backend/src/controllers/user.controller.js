const { listUsers, createUser, updateUser } = require('../services/user.service');
const { writeAuditLog } = require('../services/audit-log.service');

async function listUsersController(request, response) {
  const users = await listUsers();
  response.json({ ok: true, users });
}

async function createUserController(request, response) {
  const result = await createUser(request.body || {});
  const user = result.user;
  await writeAuditLog({
    actorUserId: request.user._id.toString(),
    actorEmail: request.user.email,
    action: 'user.create',
    targetType: 'user',
    targetId: user.id,
    ip: request.ip,
    metadata: { email: user.email, role: user.role },
  });
  response.status(201).json({ ok: true, ...result });
}

async function updateUserController(request, response) {
  const user = await updateUser(request.params.userId, request.body || {});
  await writeAuditLog({
    actorUserId: request.user._id.toString(),
    actorEmail: request.user.email,
    action: 'user.update',
    targetType: 'user',
    targetId: user.id,
    ip: request.ip,
    metadata: { role: user.role, active: user.active },
  });
  response.json({ ok: true, user });
}

module.exports = { listUsersController, createUserController, updateUserController };
