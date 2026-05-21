async function healthController(request, response) {
  response.json({
    ok: true,
    service: 'fleetpulse-backend',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { healthController };
