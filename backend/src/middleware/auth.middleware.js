const env = require('../config/env');
const { AppError } = require('../utils/errors');
const { verifyToken } = require('../services/auth.service');

function requireMobileApiKey(request, response, next) {
  const providedKey = request.header('x-mobile-api-key');

  if (!providedKey || providedKey !== env.mobileApiKey) {
    return next(new AppError(401, 'Unauthorized'));
  }

  return next();
}

async function requireJwtAuth(request, response, next) {
  const authorization = request.header('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Unauthorized'));
  }

  try {
    const user = await verifyToken(token);
    request.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAuthenticatedMobileClient(request, response, next) {
  requireMobileApiKey(request, response, (error) => {
    if (error) return next(error);
    return requireJwtAuth(request, response, next);
  });
}

function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new AppError(403, 'Forbidden'));
    }
    return next();
  };
}

module.exports = { requireMobileApiKey, requireJwtAuth, requireAuthenticatedMobileClient, requireRole };
