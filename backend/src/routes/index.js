const express = require('express');
const { asyncHandler } = require('../utils/http');
const { healthController } = require('../controllers/health.controller');
const { syncStateController, registerPushTokenController } = require('../controllers/sync.controller');
const { listIncidentsController, runDispatcherController } = require('../controllers/incident.controller');

const router = express.Router();

router.get('/health', asyncHandler(healthController));
router.get('/api/incidents', asyncHandler(listIncidentsController));
router.post('/api/sync-state', asyncHandler(syncStateController));
router.post('/api/register-push-token', asyncHandler(registerPushTokenController));
router.post('/api/dispatcher/run', asyncHandler(runDispatcherController));

module.exports = router;
