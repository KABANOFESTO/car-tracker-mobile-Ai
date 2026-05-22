const { mongoose } = require('../config/database');
const User = require('../models/User');
const Incident = require('../models/Incident');
const FleetState = require('../models/FleetState');
const PushToken = require('../models/PushToken');

async function healthController(request, response) {
  const [userCount, incidentCount, fleetStateCount, pushTokenCount] = await Promise.all([
    User.countDocuments(),
    Incident.countDocuments(),
    FleetState.countDocuments(),
    PushToken.countDocuments({ active: true }),
  ]);

  response.json({
    ok: true,
    service: 'fleetpulse-backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState,
    },
    metrics: {
      users: userCount,
      incidents: incidentCount,
      fleetStates: fleetStateCount,
      activePushTokens: pushTokenCount,
      memoryRssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    },
  });
}

module.exports = { healthController };
