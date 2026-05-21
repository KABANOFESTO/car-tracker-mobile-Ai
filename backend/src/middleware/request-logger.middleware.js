function requestLogger(request, response, next) {
  const startedAt = Date.now();

  response.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const meta = {
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs,
      ip: request.ip,
      userAgent: request.get('user-agent') || '',
      userId: request.user ? String(request.user._id || request.user.id || '') : null,
    };

    console.log('[request]', JSON.stringify(meta));
  });

  next();
}

module.exports = { requestLogger };
