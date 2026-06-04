const express = require('express');
const { asyncHandler } = require('../utils/http');
const { healthController } = require('../controllers/health.controller');
const { getFleetStateController, syncStateController, registerPushTokenController } = require('../controllers/sync.controller');
const { listIncidentsController, acknowledgeIncidentController, runDispatcherController } = require('../controllers/incident.controller');
const {
  changePasswordController,
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  resetPasswordController,
} = require('../controllers/auth.controller');
const { listUsersController, createUserController, updateUserController, deleteUserController } = require('../controllers/user.controller');
const { listRequestLogsController, listAuditLogsController, listErrorLogsController } = require('../controllers/log.controller');
const { requireAuthenticatedMobileClient, requireJwtAuth, requireRole } = require('../middleware/auth.middleware');
const { createRateLimiter } = require('../middleware/rate-limit.middleware');
const {
  validateChangePasswordPayload,
  validateCreateUserPayload,
  validateForgotPasswordPayload,
  validatePushTokenPayload,
  validateRefreshPayload,
  validateResetPasswordPayload,
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
router.post('/api/auth/refresh', authRateLimit, validateRefreshPayload, asyncHandler(refreshController));
router.post('/api/auth/forgot-password', authRateLimit, validateForgotPasswordPayload, asyncHandler(forgotPasswordController));
router.post('/api/auth/reset-password', authRateLimit, validateResetPasswordPayload, asyncHandler(resetPasswordController));
router.get('/api/auth/me', requireJwtAuth, asyncHandler(meController));
router.post('/api/auth/logout', requireJwtAuth, validateRefreshPayload, asyncHandler(logoutController));
router.post('/api/auth/change-password', requireJwtAuth, validateChangePasswordPayload, asyncHandler(changePasswordController));
router.get('/api/incidents', requireJwtAuth, requireRole('admin', 'owner'), asyncHandler(listIncidentsController));
router.patch('/api/incidents/:incidentId/acknowledge', requireJwtAuth, requireRole('admin', 'owner'), asyncHandler(acknowledgeIncidentController));
router.get('/api/fleet-state', requireJwtAuth, requireRole('admin', 'owner'), asyncHandler(getFleetStateController));
router.get('/api/admin/users', requireJwtAuth, requireRole('admin'), asyncHandler(listUsersController));
router.post('/api/admin/users', requireJwtAuth, requireRole('admin'), validateCreateUserPayload, asyncHandler(createUserController));
router.patch('/api/admin/users/:userId', requireJwtAuth, requireRole('admin'), validateUpdateUserPayload, asyncHandler(updateUserController));
router.delete('/api/admin/users/:userId', requireJwtAuth, requireRole('admin'), asyncHandler(deleteUserController));
router.get('/api/admin/logs/requests', requireJwtAuth, requireRole('admin'), asyncHandler(listRequestLogsController));
router.get('/api/admin/logs/audit', requireJwtAuth, requireRole('admin'), asyncHandler(listAuditLogsController));
router.get('/api/admin/logs/errors', requireJwtAuth, requireRole('admin'), asyncHandler(listErrorLogsController));
router.post('/api/sync-state', writeRateLimit, requireAuthenticatedMobileClient, requireRole('admin', 'owner'), validateSyncStatePayload, asyncHandler(syncStateController));
router.post('/api/register-push-token', writeRateLimit, requireAuthenticatedMobileClient, requireRole('admin', 'owner'), validatePushTokenPayload, asyncHandler(registerPushTokenController));
router.post('/api/dispatcher/run', writeRateLimit, requireJwtAuth, requireRole('admin'), asyncHandler(runDispatcherController));

module.exports = router;
