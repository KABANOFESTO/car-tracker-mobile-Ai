const { writeRequestLog } = require('../services/request-log.service');

function requestLogger(request, response, next) {
  const startedAt = Date.now();

  response.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const severity =
      response.statusCode >= 500 ? 'error' :
      response.statusCode >= 400 ? 'warning' :
      'info';
    const meta = {
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      severity,
      durationMs,
      ip: request.ip,
      userAgent: request.get('user-agent') || '',
      userId: request.user ? String(request.user._id || request.user.id || '') : null,
    };

    console.log('[request]', JSON.stringify(meta));
    writeRequestLog(meta).catch(() => undefined);
  });

  next();
}

module.exports = { requestLogger };
