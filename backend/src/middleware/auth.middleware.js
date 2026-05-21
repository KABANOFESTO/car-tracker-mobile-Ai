const env = require('../config/env');
const { AppError } = require('../utils/errors');

function requireMobileApiKey(request, response, next) {
  const providedKey = request.header('x-mobile-api-key');

  if (!providedKey || providedKey !== env.mobileApiKey) {
    return next(new AppError(401, 'Unauthorized'));
  }

  return next();
}

module.exports = { requireMobileApiKey };
