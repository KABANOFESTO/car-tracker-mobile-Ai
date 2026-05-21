# FleetPulse Backend API

This backend serves three responsibilities:

1. Mobile app fleet-state sync using a shared mobile API key
2. Admin/owner access using JWT authentication
3. Backend dispatcher polling ThingSpeak and sending Expo push notifications

## Environment

Set these in [`.env`](./.env):

```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/fleetpulse
MOBILE_API_KEY=replace_with_shared_mobile_api_key
JWT_SECRET=replace_with_long_random_jwt_secret
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_NAME=Fleet Admin
THINGSPEAK_BASE_URL=https://api.thingspeak.com
DISPATCHER_POLL_INTERVAL_MS=30000
EXPO_PUSH_API_URL=https://exp.host/--/api/v2/push/send
```

## Start

```bash
cd backend
npm install
npm start
```

## Auth model

- Mobile sync routes use header: `x-mobile-api-key`
- Human/admin routes use header: `Authorization: Bearer <jwt>`

## Endpoints

### Health

`GET /health`

### Auth

#### Login

`POST /api/auth/login`

Body:

```json
{
  "email": "admin@example.com",
  "password": "change-this-password"
}
```

Response:

```json
{
  "ok": true,
  "token": "<jwt>",
  "user": {
    "id": "682ddc...",
    "name": "Fleet Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

#### Current user

`GET /api/auth/me`

Headers:

```http
Authorization: Bearer <jwt>
```

### Incidents

#### List incidents

`GET /api/incidents`

Headers:

```http
Authorization: Bearer <jwt>
```

### Admin user management

#### List users

`GET /api/admin/users`

Headers:

```http
Authorization: Bearer <jwt>
```

#### Create owner/admin

`POST /api/admin/users`

Headers:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

Body:

```json
{
  "name": "Owner One",
  "email": "owner1@example.com",
  "password": "Owner12345",
  "role": "owner",
  "active": true
}
```

#### Update owner/admin

`PATCH /api/admin/users/:userId`

Headers:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

Body example:

```json
{
  "name": "Owner One Updated",
  "role": "owner",
  "active": true,
  "password": "Owner12345New"
}
```

### Admin logs

#### Request logs

`GET /api/admin/logs/requests`

#### Audit logs

`GET /api/admin/logs/audit`

Headers for both:

```http
Authorization: Bearer <jwt>
```

### Mobile app sync

#### Sync state

`POST /api/sync-state`

Headers:

```http
x-mobile-api-key: replace_with_shared_mobile_api_key
Content-Type: application/json
```

Body sample:

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
      "lastSeen": "2026-05-21T12:42:10.000Z"
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
      "armedAt": "2026-05-21T20:55:00.000Z"
    }
  ],
  "syncedAt": "2026-05-21T12:42:10.000Z"
}
```

#### Register Expo push token

`POST /api/register-push-token`

Headers:

```http
x-mobile-api-key: replace_with_shared_mobile_api_key
Content-Type: application/json
```

Body:

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android",
  "projectId": "5ea2c560-558d-42b0-a23e-fdc6f72a33e8",
  "registeredAt": "2026-05-21T12:42:10.000Z"
}
```

### Dispatcher run

`POST /api/dispatcher/run`

Headers:

```http
Authorization: Bearer <jwt>
```

Admin only.

## Postman setup

Create two Postman environments:

### 1. Admin API

- `baseUrl` = `http://localhost:4000`
- `jwt` = paste token after login

Use header:

```http
Authorization: Bearer {{jwt}}
```

### 2. Mobile Sync

- `baseUrl` = `http://localhost:4000`
- `mobileApiKey` = same value as `MOBILE_API_KEY`

Use header:

```http
x-mobile-api-key: {{mobileApiKey}}
```

## Audit coverage

Current audit events are written for:

- `user.create`
- `user.update`

Request logs are written for every request with:

- path
- method
- status code
- duration
- IP
- user-agent
- user id when authenticated
