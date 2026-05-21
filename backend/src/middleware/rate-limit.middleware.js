const { AppError } = require('../utils/errors');

function createRateLimiter({ windowMs, maxRequests, keyResolver }) {
  const bucket = new Map();

  return (request, response, next) => {
    const now = Date.now();
    const key = keyResolver(request);
    const current = bucket.get(key);

    if (!current || current.resetAt <= now) {
      bucket.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      response.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
      return next(new AppError(429, 'Too many requests'));
    }

    current.count += 1;
    return next();
  };
}

module.exports = { createRateLimiter };
