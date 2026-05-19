# FleetPulse — Claude Guide

## Project Overview
FleetPulse is a real-time fleet management mobile app for tracking vehicle locations, monitoring status, and analyzing trip history. The geographic context is Kigali, Rwanda. Each vehicle is an ESP32+GPS device that publishes telemetry to ThingSpeak.

## Tech Stack
- **Framework:** React Native 0.81.5 + Expo 54, React 19 (new compiler enabled)
- **Routing:** Expo Router (file-based, typed routes)
- **Maps:** react-native-maps with Google Maps provider (Android); web fallback renders a placeholder
- **Live data:** ThingSpeak API — polled every 15 s per vehicle channel
- **Config backend:** Appwrite — stores global geofence configuration
- **Storage:** `@react-native-async-storage/async-storage` — persists registered vehicles across restarts
- **Build:** EAS (eas.json) — profiles: development, preview, production
- **Language:** TypeScript throughout

## Key Directories

| Path | Purpose |
|------|---------|
| `app/` | Expo Router screens — `(tabs)/` group + `register.tsx` |
| `components/fleet/` | Vehicle list, cards, animated bottom sheet |
| `components/map/` | Map wrapper, custom vehicle markers |
| `components/reports/` | Calendar picker, stats cards, FeedSummaryCard |
| `services/thingspeakService.ts` | ThingSpeak polling, AsyncStorage persistence, live vehicle state |
| `services/appwriteService.ts` | Appwrite geofence config read/write |
| `services/tripService.ts` | ThingSpeak feed history → FeedSummary[] per day |
| `hooks/` | `useVehicles`, `useFeedHistory`, `useGeofenceConfig` — bridge services to UI |
| `constants/types.ts` | Single source of all shared TypeScript interfaces |
| `constants/theme.ts` | Single source of truth for colors (`FLEET_COLORS`) |
| `.env` | API keys and endpoints (copy `.env.example` to get started) |

## Screens
- `app/(tabs)/index.tsx` — Fleet Dashboard (map + animated bottom sheet)
- `app/(tabs)/map.tsx` — Dedicated map view
- `app/(tabs)/reports.tsx` — Daily feed summaries with month filtering
- `app/(tabs)/settings.tsx` — App settings
- `app/(tabs)/geofence.tsx` — Geofence config editor (reads/writes Appwrite)
- `app/register.tsx` — Add vehicle (ThingSpeak Channel ID + Read API Key)

## Essential Commands

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Run on specific platform
npx expo start --android
npx expo start --ios

# EAS builds
eas build --profile development --platform android
eas build --profile preview --platform all
eas build --profile production --platform all

# Type check
npx tsc --noEmit
```

## Environment Variables
Copy `.env.example` to `.env` and fill in:
- `EXPO_PUBLIC_APPWRITE_PROJECT_ID` — your Appwrite project ID
- Other Appwrite IDs are pre-filled from the existing Appwrite document

Per-vehicle ThingSpeak Channel ID and Read API Key are registered in-app (stored in AsyncStorage), not in `.env`.

## Theme
All colors come from `constants/theme.ts` — import `FLEET_COLORS` for dark-theme values. Never use hardcoded color strings in components.

## Additional Documentation
Check these files when working in the relevant area:

- `.claude/docs/architectural_patterns.md` — service/hook/component data flow, ThingSpeak subscription pattern, Appwrite config pattern, animated bottom sheet, map integration
