# Architectural Patterns

## 1. Services → Hooks → Components Data Flow

All data access follows a strict three-layer pipeline — never skip a layer.

```
services/ (data fetching / mock)
    ↓
hooks/ (state, derived values, cleanup)
    ↓
Screens / Components (render only)
```

**Examples:**
- `services/vehicleService.ts` → `hooks/useVehicles.ts` → `app/(tabs)/index.tsx`
- `services/tripService.ts` → `hooks/useTrips.ts` → `app/(tabs)/reports.tsx`

Components never import from `services/` directly.

---

## 2. Subscription / Callback Pattern (Live Updates)

Services expose a subscribe-style API instead of returning promises, enabling live streaming from either mock intervals or Firebase `onSnapshot`.

**Pattern** (`services/vehicleService.ts:13-40`):
```
subscribeVehicles(callback: (vehicles: Vehicle[]) => void): () => void
```
- Returns an unsubscribe function.
- Hook calls it in `useEffect` and returns the unsubscribe as cleanup (`hooks/useVehicles.ts:10-20`).
- Mock mode: emits current list immediately, then re-emits every 3 s via `setInterval`.
- Firebase mode: wires the same callback to a Firestore `onSnapshot`.

When adding new real-time data, follow this same subscribe/unsubscribe shape.

---

## 3. Mock / Firebase Dual Mode

Every service file begins with a `USE_MOCK` boolean flag:

- `services/vehicleService.ts:4` — `const USE_MOCK = true`
- `services/tripService.ts:4` — `const USE_MOCK = true`

Each exported function branches on this flag. The Firebase branch is fully written but commented out pending credentials. This lets the app run without a backend while keeping the integration path clear.

**Rule:** keep mock and real branches structurally identical so they are interchangeable.

---

## 4. Derived Stats Inside Hooks

Hooks compute aggregate stats from raw data rather than pushing that logic into components or services.

- `hooks/useVehicles.ts` derives `{ total, moving, idle, offline }` counts from the vehicle list.
- `hooks/useTrips.ts` derives `{ totalDistance, totalFuel, tripCount, percentChanges }` and compares current month vs previous month.

Components receive ready-to-render stats; they never iterate raw arrays to compute metrics.

---

## 5. Animated Bottom Sheet (PanResponder)

`components/fleet/ActiveFleetSheet.tsx` implements a draggable bottom sheet using React Native's `PanResponder` + `Animated.Value` — no third-party library.

Key details:
- Sheet snaps to two heights: collapsed (~120 px) and expanded (~55% of screen).
- `panY` `Animated.Value` tracks drag; `handleGesture` snaps on release.
- The same component renders on all platforms (web uses the same code path).

When adding new bottom-sheet-style UI, reuse or extend this component rather than introducing a library.

---

## 6. Feature-Based Component Organization

Components are grouped by feature domain, not by type:

```
components/
  fleet/      ← vehicle list, cards
  map/        ← map wrapper, markers
  reports/    ← calendar, stats, trip rows
  ui/         ← generic primitives (icon-symbol, collapsible)
```

Shared presentational primitives (`themed-text.tsx`, `themed-view.tsx`) live at the `components/` root. Do not flatten the feature subdirectories.

---

## 7. Single-Source Theme via `FLEET_COLORS`

`constants/theme.ts` exports `FLEET_COLORS` (dark-theme palette) and a legacy `Colors` object for compatibility with Expo template components. All new code should use `FLEET_COLORS`:

- `background: '#0B0E27'`
- `primary: '#4F6EF7'`
- `surface: '#141728'`
- Status colors: `moving`, `idle`, `offline` keys on `FLEET_COLORS`

Vehicle status badge colors are read directly from `FLEET_COLORS[status]` in `components/fleet/VehicleCard.tsx` — extend the palette there if new statuses are added.

---

## 8. Map Platform Guard

`react-native-maps` does not support web. `components/map/FleetMap.tsx` lazy-imports the map and renders a `<View>` placeholder on web. Any screen that embeds the map must be aware that map interactions are unavailable on web.

Google Maps dark-theme JSON is applied inline in `FleetMap.tsx` to match the app's dark theme.

---

## 9. Form Validation Pattern

`app/register.tsx` shows the standard validation approach:
- Required-field checks with `Alert.alert` for errors.
- Field-specific length constraints (e.g., Device ID must be exactly 16 characters).
- No external form library — plain `useState` per field + a `handleSubmit` function that validates before calling the service.

Follow this pattern for any new forms unless complexity warrants a form library.
