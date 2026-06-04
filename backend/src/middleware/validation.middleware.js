const { AppError } = require('../utils/errors');
const VEHICLE_TYPES = ['Car', 'Truck', 'Van', 'Motorcycle', 'Bus', 'Other'];
const VEHICLE_STATUSES = ['moving', 'idle', 'offline', 'disabled'];
const GEOFENCE_TYPES = ['home', 'parking', 'work', 'restricted'];
const ALERT_SEVERITIES = ['critical', 'warning', 'info'];
const ALERT_CATEGORIES = ['geofence', 'security', 'offline', 'driving', 'system'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isIsoTimestamp(value) {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function validateEnum(value, allowed, fieldPath) {
  if (!allowed.includes(value)) {
    throw new AppError(400, `${fieldPath} must be one of: ${allowed.join(', ')}`);
  }
}

function validateCoordinate(value, min, max, fieldPath) {
  if (!isFiniteNumber(value) || value < min || value > max) {
    throw new AppError(400, `${fieldPath} must be between ${min} and ${max}`);
  }
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
  validateEnum(vehicle.type, VEHICLE_TYPES, `vehicles[${index}].type`);
  validateEnum(vehicle.status, VEHICLE_STATUSES, `vehicles[${index}].status`);
  if (vehicle.active != null && typeof vehicle.active !== 'boolean') {
    throw new AppError(400, `vehicles[${index}].active must be a boolean`);
  }
  if (!isIsoTimestamp(vehicle.lastSeen)) {
    throw new AppError(400, `vehicles[${index}].lastSeen must be an ISO timestamp`);
  }

  if (!vehicle.location || typeof vehicle.location !== 'object') {
    throw new AppError(400, `vehicles[${index}].location must be an object`);
  }

  validateCoordinate(vehicle.location.latitude, -90, 90, `vehicles[${index}].location.latitude`);
  validateCoordinate(vehicle.location.longitude, -180, 180, `vehicles[${index}].location.longitude`);

  for (const key of ['speed', 'direction', 'altitude', 'satellites', 'hdop']) {
    if (!isFiniteNumber(vehicle[key])) {
      throw new AppError(400, `vehicles[${index}].${key} must be a finite number`);
    }
  }
  if (vehicle.direction < 0 || vehicle.direction > 360) {
    throw new AppError(400, `vehicles[${index}].direction must be between 0 and 360`);
  }
  if (vehicle.satellites < 0) {
    throw new AppError(400, `vehicles[${index}].satellites must be 0 or greater`);
  }
  if (vehicle.hdop < 0) {
    throw new AppError(400, `vehicles[${index}].hdop must be 0 or greater`);
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
  validateEnum(zone.type, GEOFENCE_TYPES, `zones[${index}].type`);

  validateCoordinate(zone.latitude, -90, 90, `zones[${index}].latitude`);
  validateCoordinate(zone.longitude, -180, 180, `zones[${index}].longitude`);
  if (!isFiniteNumber(zone.radius) || zone.radius <= 0) {
    throw new AppError(400, `zones[${index}].radius must be a positive number`);
  }

  for (const key of ['activeFromHour', 'activeToHour']) {
    if (zone[key] != null && !isFiniteNumber(zone[key])) {
      throw new AppError(400, `zones[${index}].${key} must be a number or null`);
    }
    if (zone[key] != null && (zone[key] < 0 || zone[key] > 23)) {
      throw new AppError(400, `zones[${index}].${key} must be between 0 and 23`);
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
  if (state.armedAt != null && !isIsoTimestamp(state.armedAt)) {
    throw new AppError(400, `protectionStates[${index}].armedAt must be an ISO timestamp`);
  }
}

function validateNoDuplicates(items, keyResolver, label) {
  const seen = new Set();
  items.forEach((item, index) => {
    const key = keyResolver(item);
    if (seen.has(key)) {
      throw new AppError(400, `${label} contains a duplicate at index ${index}`);
    }
    seen.add(key);
  });
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
    validateNoDuplicates(body.vehicles, (item) => item.id, 'vehicles');
    validateNoDuplicates(body.zones, (item) => item.id, 'zones');
    validateNoDuplicates(body.protectionStates, (item) => item.vehicleId, 'protectionStates');
    if (body.syncedAt != null && !isIsoTimestamp(body.syncedAt)) {
      throw new AppError(400, 'syncedAt must be an ISO timestamp');
    }
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

  if (body.registeredAt != null && !isIsoTimestamp(body.registeredAt)) {
    return next(new AppError(400, 'registeredAt must be an ISO timestamp'));
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

  if (body.password != null && (!isNonEmptyString(body.password) || body.password.length < 8)) {
    return next(new AppError(400, 'password must be at least 8 characters when provided'));
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

function validateRefreshPayload(request, response, next) {
  const body = request.body || {};
  if (!isNonEmptyString(body.refreshToken)) {
    return next(new AppError(400, 'refreshToken must be a non-empty string'));
  }
  return next();
}

function validateChangePasswordPayload(request, response, next) {
  const body = request.body || {};
  if (!isNonEmptyString(body.currentPassword)) {
    return next(new AppError(400, 'currentPassword is required'));
  }
  if (!isNonEmptyString(body.newPassword) || body.newPassword.length < 8) {
    return next(new AppError(400, 'newPassword must be at least 8 characters'));
  }
  return next();
}

function validateForgotPasswordPayload(request, response, next) {
  const body = request.body || {};
  if (!isNonEmptyString(body.email) || !body.email.includes('@')) {
    return next(new AppError(400, 'email must be a valid email string'));
  }
  return next();
}

function validateResetPasswordPayload(request, response, next) {
  const body = request.body || {};
  if (!isNonEmptyString(body.resetToken)) {
    return next(new AppError(400, 'resetToken is required'));
  }
  if (!isNonEmptyString(body.newPassword) || body.newPassword.length < 8) {
    return next(new AppError(400, 'newPassword must be at least 8 characters'));
  }
  return next();
}

module.exports = {
  validateSyncStatePayload,
  validatePushTokenPayload,
  validateCreateUserPayload,
  validateUpdateUserPayload,
  validateRefreshPayload,
  validateChangePasswordPayload,
  validateForgotPasswordPayload,
  validateResetPasswordPayload,
};
