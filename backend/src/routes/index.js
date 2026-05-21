const express = require('express');
const { asyncHandler } = require('../utils/http');
const { healthController } = require('../controllers/health.controller');
const { syncStateController, registerPushTokenController } = require('../controllers/sync.controller');
const { listIncidentsController, runDispatcherController } = require('../controllers/incident.controller');
const { requireMobileApiKey } = require('../middleware/auth.middleware');
const { validatePushTokenPayload, validateSyncStatePayload } = require('../middleware/validation.middleware');

const router = express.Router();

router.get('/health', asyncHandler(healthController));
router.get('/api/incidents', asyncHandler(listIncidentsController));
router.post('/api/sync-state', requireMobileApiKey, validateSyncStatePayload, asyncHandler(syncStateController));
router.post('/api/register-push-token', requireMobileApiKey, validatePushTokenPayload, asyncHandler(registerPushTokenController));
router.post('/api/dispatcher/run', requireMobileApiKey, asyncHandler(runDispatcherController));

module.exports = router;
