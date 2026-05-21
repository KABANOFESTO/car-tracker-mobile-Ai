const express = require('express');
const { asyncHandler } = require('../utils/http');
const { healthController } = require('../controllers/health.controller');
const { syncStateController, registerPushTokenController } = require('../controllers/sync.controller');
const { listIncidentsController, runDispatcherController } = require('../controllers/incident.controller');
const { loginController, meController } = require('../controllers/auth.controller');
const { listUsersController, createUserController, updateUserController } = require('../controllers/user.controller');
const { listRequestLogsController, listAuditLogsController } = require('../controllers/log.controller');
const { requireJwtAuth, requireMobileApiKey, requireRole } = require('../middleware/auth.middleware');
const { createRateLimiter } = require('../middleware/rate-limit.middleware');
const {
  validateCreateUserPayload,
  validatePushTokenPayload,
  validateSyncStatePayload,
  validateUpdateUserPayload,
} = require('../middleware/validation.middleware');

const router = express.Router();
const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyResolver: (request) => `auth:${request.ip}`,
});
const writeRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  keyResolver: (request) => `write:${request.ip}`,
});

router.get('/health', asyncHandler(healthController));
router.post('/api/auth/login', authRateLimit, asyncHandler(loginController));
router.get('/api/auth/me', requireJwtAuth, asyncHandler(meController));
router.get('/api/incidents', requireJwtAuth, requireRole('admin', 'owner'), asyncHandler(listIncidentsController));
router.get('/api/admin/users', requireJwtAuth, requireRole('admin'), asyncHandler(listUsersController));
router.post('/api/admin/users', requireJwtAuth, requireRole('admin'), validateCreateUserPayload, asyncHandler(createUserController));
router.patch('/api/admin/users/:userId', requireJwtAuth, requireRole('admin'), validateUpdateUserPayload, asyncHandler(updateUserController));
router.get('/api/admin/logs/requests', requireJwtAuth, requireRole('admin'), asyncHandler(listRequestLogsController));
router.get('/api/admin/logs/audit', requireJwtAuth, requireRole('admin'), asyncHandler(listAuditLogsController));
router.post('/api/sync-state', writeRateLimit, requireMobileApiKey, validateSyncStatePayload, asyncHandler(syncStateController));
router.post('/api/register-push-token', writeRateLimit, requireMobileApiKey, validatePushTokenPayload, asyncHandler(registerPushTokenController));
router.post('/api/dispatcher/run', writeRateLimit, requireJwtAuth, requireRole('admin'), asyncHandler(runDispatcherController));

module.exports = router;
