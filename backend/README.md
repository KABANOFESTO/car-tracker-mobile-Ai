# FleetPulse Backend API

This backend is structured for the actual project flow:

1. owner/admin authentication with JWT access tokens and refresh tokens
2. owner-scoped fleet state sync from the mobile app
3. owner-scoped incidents and push notification dispatch
4. audit, request, and error logging for operations

## Environment

Set these values in [`backend/.env`](./.env):

```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/fleetpulse
CORS_ORIGINS=http://localhost:8081,exp://127.0.0.1:8081
MOBILE_API_KEY=replace_with_shared_mobile_api_key
JWT_SECRET=replace_with_long_random_jwt_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_NAME=Fleet Admin
THINGSPEAK_BASE_URL=https://api.thingspeak.com
DISPATCHER_POLL_INTERVAL_MS=30000
EXPO_PUSH_API_URL=https://exp.host/--/api/v2/push/send
PASSWORD_RESET_TOKEN_TTL_MINUTES=30
LOG_RETENTION_DAYS=30
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=FleetPulse
APP_LOGIN_URL=http://localhost:8081/login
```

## Start

```bash
cd backend
npm install
npm start
```

## Auth model

- mobile sync routes require:
  - `x-mobile-api-key`
  - `Authorization: Bearer <access-token>`
- human/admin routes require:
  - `Authorization: Bearer <access-token>`

## Main endpoints

### Health

- `GET /health`

### Auth

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Login request:

```json
{
  "email": "admin@example.com",
  "password": "change-this-password"
}
```

Login response:

```json
{
  "ok": true,
  "accessToken": "<jwt>",
  "refreshToken": "<opaque-refresh-token>",
  "user": {
    "id": "682ddc...",
    "name": "Fleet Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

Refresh request:

```json
{
  "refreshToken": "<opaque-refresh-token>"
}
```

Change-password request:

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

### Owner fleet state

- `GET /api/fleet-state`
- `POST /api/sync-state`
- `POST /api/register-push-token`

Sync headers:

```http
x-mobile-api-key: replace_with_shared_mobile_api_key
Authorization: Bearer <jwt>
Content-Type: application/json
```

Sync body:

```json
{
  "vehicles": [
    {
      "id": "v1747150400000",
      "name": "Taxi Alpha",
      "channelId": 3316972,
      "readApiKey": "ABCDEFGHIJKLMNOP",
      "type": "Car",
      "licensePlate": "RAC123A",
      "driver": "Mugisha",
      "status": "moving",
      "speed": 34.2,
      "location": { "latitude": -1.9441, "longitude": 30.0619 },
      "direction": 112,
      "altitude": 1480,
      "satellites": 8,
      "hdop": 1.8,
      "isOutsideFence": false,
      "lastSeen": "2026-05-22T12:42:10.000Z"
    }
  ],
  "zones": [
    {
      "id": "zone-1",
      "vehicleId": "v1747150400000",
      "name": "Night Parking",
      "type": "parking",
      "latitude": -1.9441,
      "longitude": 30.0619,
      "radius": 25,
      "activeFromHour": 21,
      "activeToHour": 6
    }
  ],
  "protectionStates": [
    {
      "vehicleId": "v1747150400000",
      "armed": true,
      "armedAt": "2026-05-22T20:55:00.000Z"
    }
  ],
  "syncedAt": "2026-05-22T12:42:10.000Z"
}
```

### Incidents

- `GET /api/incidents`
- `PATCH /api/incidents/:incidentId/acknowledge`

Supported list filters:

- `page`
- `limit`
- `vehicleId`
- `severity`
- `category`
- `acknowledged`
- `startDate`
- `endDate`

### Admin APIs

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:userId`
- `GET /api/admin/logs/requests`
- `GET /api/admin/logs/audit`
- `GET /api/admin/logs/errors`
- `POST /api/dispatcher/run`

Create-user body:

```json
{
  "name": "Owner One",
  "email": "owner1@example.com",
  "password": "Owner12345",
  "role": "owner",
  "active": true
}
```

## Postman setup

### Admin API environment

- `baseUrl` = `http://localhost:4000`
- `jwt` = paste the `accessToken`
- `refreshToken` = paste the `refreshToken`

Headers:

```http
Authorization: Bearer {{jwt}}
```

### Mobile sync environment

- `baseUrl` = `http://localhost:4000`
- `mobileApiKey` = same value as `MOBILE_API_KEY`
- `jwt` = paste the owner `accessToken`

Headers:

```http
x-mobile-api-key: {{mobileApiKey}}
Authorization: Bearer {{jwt}}
```

## Operational notes

- incidents are owner-scoped
- push tokens are owner-scoped
- fleet state is owner-scoped
- request, audit, and error logs are retained according to `LOG_RETENTION_DAYS`
- password reset token delivery still needs email/SMS infrastructure in production
- if SMTP is not configured, admin-created users are still created and the API returns a temporary password for manual delivery
