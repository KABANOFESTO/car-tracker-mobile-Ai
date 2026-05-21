const { AppError } = require('../utils/errors');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateVehicle(vehicle, index) {
  if (!vehicle || typeof vehicle !== 'object') {
    throw new AppError(400, `vehicles[${index}] must be an object`);
  }

  const requiredStrings = ['id', 'name', 'readApiKey', 'type', 'licensePlate', 'status', 'lastSeen'];
  for (const key of requiredStrings) {
    if (!isNonEmptyString(vehicle[key])) {
      throw new AppError(400, `vehicles[${index}].${key} must be a non-empty string`);
    }
  }

  if (!isFiniteNumber(vehicle.channelId) || vehicle.channelId <= 0) {
    throw new AppError(400, `vehicles[${index}].channelId must be a positive number`);
  }

  if (!vehicle.location || typeof vehicle.location !== 'object') {
    throw new AppError(400, `vehicles[${index}].location must be an object`);
  }

  for (const key of ['latitude', 'longitude']) {
    if (!isFiniteNumber(vehicle.location[key])) {
      throw new AppError(400, `vehicles[${index}].location.${key} must be a finite number`);
    }
  }

  for (const key of ['speed', 'direction', 'altitude', 'satellites', 'hdop']) {
    if (!isFiniteNumber(vehicle[key])) {
      throw new AppError(400, `vehicles[${index}].${key} must be a finite number`);
    }
  }

  if (typeof vehicle.isOutsideFence !== 'boolean') {
    throw new AppError(400, `vehicles[${index}].isOutsideFence must be a boolean`);
  }
}

function validateZone(zone, index) {
  if (!zone || typeof zone !== 'object') {
    throw new AppError(400, `zones[${index}] must be an object`);
  }

  for (const key of ['id', 'vehicleId', 'name', 'type']) {
    if (!isNonEmptyString(zone[key])) {
      throw new AppError(400, `zones[${index}].${key} must be a non-empty string`);
    }
  }

  for (const key of ['latitude', 'longitude', 'radius']) {
    if (!isFiniteNumber(zone[key])) {
      throw new AppError(400, `zones[${index}].${key} must be a finite number`);
    }
  }

  for (const key of ['activeFromHour', 'activeToHour']) {
    if (zone[key] != null && !isFiniteNumber(zone[key])) {
      throw new AppError(400, `zones[${index}].${key} must be a number or null`);
    }
  }
}

function validateProtectionState(state, index) {
  if (!state || typeof state !== 'object') {
    throw new AppError(400, `protectionStates[${index}] must be an object`);
  }

  if (!isNonEmptyString(state.vehicleId)) {
    throw new AppError(400, `protectionStates[${index}].vehicleId must be a non-empty string`);
  }

  if (typeof state.armed !== 'boolean') {
    throw new AppError(400, `protectionStates[${index}].armed must be a boolean`);
  }

  if (state.armedAt != null && typeof state.armedAt !== 'string') {
    throw new AppError(400, `protectionStates[${index}].armedAt must be a string or null`);
  }
}

function validateSyncStatePayload(request, response, next) {
  const body = request.body || {};

  if (!Array.isArray(body.vehicles)) {
    return next(new AppError(400, 'vehicles must be an array'));
  }

  if (!Array.isArray(body.zones)) {
    return next(new AppError(400, 'zones must be an array'));
  }

  if (!Array.isArray(body.protectionStates)) {
    return next(new AppError(400, 'protectionStates must be an array'));
  }

  try {
    body.vehicles.forEach(validateVehicle);
    body.zones.forEach(validateZone);
    body.protectionStates.forEach(validateProtectionState);
  } catch (error) {
    return next(error);
  }

  return next();
}

function validatePushTokenPayload(request, response, next) {
  const body = request.body || {};

  if (!isNonEmptyString(body.token)) {
    return next(new AppError(400, 'token must be a non-empty string'));
  }

  if (!body.token.startsWith('ExponentPushToken[') && !body.token.startsWith('ExpoPushToken[')) {
    return next(new AppError(400, 'token is not a valid Expo push token'));
  }

  if (!isNonEmptyString(body.platform)) {
    return next(new AppError(400, 'platform must be a non-empty string'));
  }

  if (body.projectId != null && typeof body.projectId !== 'string') {
    return next(new AppError(400, 'projectId must be a string or null'));
  }

  return next();
}

function validateCreateUserPayload(request, response, next) {
  const body = request.body || {};
  const validRoles = ['admin', 'owner'];

  if (!isNonEmptyString(body.name)) {
    return next(new AppError(400, 'name must be a non-empty string'));
  }

  if (!isNonEmptyString(body.email) || !body.email.includes('@')) {
    return next(new AppError(400, 'email must be a valid email string'));
  }

  if (!isNonEmptyString(body.password) || body.password.length < 8) {
    return next(new AppError(400, 'password must be at least 8 characters'));
  }

  if (!validRoles.includes(body.role)) {
    return next(new AppError(400, 'role must be admin or owner'));
  }

  if (body.active != null && typeof body.active !== 'boolean') {
    return next(new AppError(400, 'active must be a boolean'));
  }

  return next();
}

function validateUpdateUserPayload(request, response, next) {
  const body = request.body || {};
  const validRoles = ['admin', 'owner'];

  if (body.name != null && !isNonEmptyString(body.name)) {
    return next(new AppError(400, 'name must be a non-empty string'));
  }

  if (body.role != null && !validRoles.includes(body.role)) {
    return next(new AppError(400, 'role must be admin or owner'));
  }

  if (body.password != null && (!isNonEmptyString(body.password) || body.password.length < 8)) {
    return next(new AppError(400, 'password must be at least 8 characters'));
  }

  if (body.active != null && typeof body.active !== 'boolean') {
    return next(new AppError(400, 'active must be a boolean'));
  }

  return next();
}

module.exports = {
  validateSyncStatePayload,
  validatePushTokenPayload,
  validateCreateUserPayload,
  validateUpdateUserPayload,
};
