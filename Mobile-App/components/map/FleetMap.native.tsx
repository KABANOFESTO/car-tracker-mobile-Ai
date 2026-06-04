import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MapView, {
  Callout,
  Circle,
  Marker,
  MapCamera,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';

import { FLEET_COLORS } from '@/constants/theme';
import { GeofenceConfig, Vehicle } from '@/constants/types';
import { announceVehicleFocus } from '@/services/voiceAssistantService';
import { VehicleMarker } from './VehicleMarker.native';

export interface FleetMapRef {
  zoomIn: () => void;
  zoomOut: () => void;
  focusVehicle: (vehicleId: string) => void;
  focusCoordinate: (coordinate: { latitude: number; longitude: number }) => void;
}

interface Props {
  vehicles: Vehicle[];
  onVehiclePress?: (vehicle: Vehicle) => void;
  focusCoordinate?: { latitude: number; longitude: number } | null;
  geofenceConfig?: GeofenceConfig | null;
  style?: StyleProp<ViewStyle>;
  showSelectedVehicleCard?: boolean;
}

const DEFAULT_REGION: Region = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const DARK_MAP_STYLE = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#0B0E27' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#AEB7D6' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0B0E27' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2D3561' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#182042' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2D3561' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#11183A' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#091122' }],
  },
];

function hasCoordinates(vehicle: Vehicle) {
  return vehicle.location.latitude !== 0 || vehicle.location.longitude !== 0;
}

function clampRegion(latitude: number, longitude: number, delta = 0.06): Region {
  return {
    latitude,
    longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

function buildInitialRegion(
  vehicles: Vehicle[],
  focusCoordinate?: { latitude: number; longitude: number } | null,
  geofenceConfig?: GeofenceConfig | null,
): Region {
  if (focusCoordinate) {
    return clampRegion(focusCoordinate.latitude, focusCoordinate.longitude, 0.03);
  }

  const liveCoordinates = vehicles.filter(hasCoordinates).map((vehicle) => vehicle.location);
  if (liveCoordinates.length > 0) {
    const latitudes = liveCoordinates.map((coordinate) => coordinate.latitude);
    const longitudes = liveCoordinates.map((coordinate) => coordinate.longitude);
    const latitude = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
    const longitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
    const latitudeDelta = Math.max(0.02, Math.abs(Math.max(...latitudes) - Math.min(...latitudes)) * 1.5 || 0.03);
    const longitudeDelta = Math.max(0.02, Math.abs(Math.max(...longitudes) - Math.min(...longitudes)) * 1.5 || 0.03);
    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }

  if (geofenceConfig && geofenceConfig.geofenceLat !== 0 && geofenceConfig.geofenceLng !== 0) {
    return clampRegion(geofenceConfig.geofenceLat, geofenceConfig.geofenceLng, 0.05);
  }

  return DEFAULT_REGION;
}

function statusTone(vehicle: Vehicle) {
  if (vehicle.active === false || vehicle.status === 'disabled') return FLEET_COLORS.textSecondary;
  if (vehicle.isOutsideFence) return FLEET_COLORS.orange;
  if (vehicle.status === 'moving') return FLEET_COLORS.green;
  if (vehicle.status === 'idle') return '#F7B955';
  return FLEET_COLORS.textSecondary;
}

function statusLabel(vehicle: Vehicle) {
  if (vehicle.active === false || vehicle.status === 'disabled') return 'Disabled';
  if (vehicle.isOutsideFence) return 'Outside fence';
  if (vehicle.status === 'moving') return 'Moving';
  if (vehicle.status === 'idle') return 'Idle';
  return 'Offline';
}

function formatLastSeen(lastSeen: string) {
  if (lastSeen === new Date(0).toISOString()) return 'Never';
  const date = new Date(lastSeen);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const FleetMap = forwardRef<FleetMapRef, Props>(
  ({ vehicles, onVehiclePress, focusCoordinate, geofenceConfig, style, showSelectedVehicleCard = true }, ref) => {
    const mapRef = useRef<MapView | null>(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const didInitialFit = useRef(false);
    const initialRegion = useMemo(
      () => buildInitialRegion(vehicles, focusCoordinate, geofenceConfig),
      [focusCoordinate, geofenceConfig, vehicles],
    );
    const liveVehicles = useMemo(() => vehicles.filter(hasCoordinates), [vehicles]);
    const selectedVehicle = useMemo(
      () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
      [selectedVehicleId, vehicles],
    );
    const activeVehicle =
      selectedVehicle ??
      liveVehicles.find((vehicle) => vehicle.active !== false && vehicle.status === 'moving') ??
      liveVehicles.find((vehicle) => vehicle.active !== false) ??
      liveVehicles[0] ??
      null;
    const geofenceCenter =
      geofenceConfig && geofenceConfig.geofenceLat !== 0 && geofenceConfig.geofenceLng !== 0
        ? { latitude: geofenceConfig.geofenceLat, longitude: geofenceConfig.geofenceLng }
        : null;

    function animateToCoordinate(coordinate: { latitude: number; longitude: number }, delta = 0.03) {
      const camera: MapCamera = {
        center: coordinate,
        pitch: 0,
        heading: 0,
        altitude: 0,
        zoom: deltaToZoom(delta),
      };
      mapRef.current?.animateCamera(camera, { duration: 450 });
    }

    function fitToLiveBounds() {
      const coordinates = [
        ...liveVehicles.map((vehicle) => vehicle.location),
        ...(geofenceCenter ? [geofenceCenter] : []),
      ];

      if (coordinates.length === 0) {
        animateToCoordinate({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude }, 0.08);
        return;
      }

      if (coordinates.length === 1) {
        animateToCoordinate(coordinates[0], 0.04);
        return;
      }

      mapRef.current?.fitToCoordinates(coordinates, {
        animated: true,
        edgePadding: { top: 120, right: 72, bottom: 220, left: 72 },
      });
    }

    useImperativeHandle(ref, () => ({
      zoomIn() {
        mapRef.current?.getCamera().then((camera) => {
          mapRef.current?.animateCamera({ ...camera, zoom: (camera.zoom ?? 14) + 1 }, { duration: 250 });
        });
      },
      zoomOut() {
        mapRef.current?.getCamera().then((camera) => {
          mapRef.current?.animateCamera({ ...camera, zoom: Math.max((camera.zoom ?? 14) - 1, 2) }, { duration: 250 });
        });
      },
      focusVehicle(vehicleId: string) {
        const vehicle = vehicles.find((entry) => entry.id === vehicleId);
        if (!vehicle || !hasCoordinates(vehicle)) return;
        setSelectedVehicleId(vehicle.id);
        animateToCoordinate(vehicle.location, vehicle.status === 'moving' ? 0.025 : 0.04);
      },
      focusCoordinate(coordinate: { latitude: number; longitude: number }) {
        setSelectedVehicleId(null);
        animateToCoordinate(coordinate, 0.03);
      },
    }));

    useEffect(() => {
      if (!selectedVehicleId) return;
      const stillExists = vehicles.some((vehicle) => vehicle.id === selectedVehicleId);
      if (!stillExists) setSelectedVehicleId(null);
    }, [selectedVehicleId, vehicles]);

    useEffect(() => {
      if (!mapReady) return;
      if (focusCoordinate) {
        animateToCoordinate(focusCoordinate, 0.03);
        return;
      }
      if (!didInitialFit.current && liveVehicles.length > 0) {
        fitToLiveBounds();
        didInitialFit.current = true;
      }
    }, [focusCoordinate, geofenceCenter, liveVehicles.length, mapReady]);

    return (
      <View style={[styles.container, style]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          customMapStyle={DARK_MAP_STYLE}
          showsCompass={false}
          showsScale={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          rotateEnabled
          pitchEnabled={false}
          onMapReady={() => {
            setMapReady(true);
            if (focusCoordinate) {
              animateToCoordinate(focusCoordinate, 0.03);
            } else if (liveVehicles.length > 0) {
              fitToLiveBounds();
            }
          }}
        >
          {geofenceCenter && geofenceConfig && (
            <>
              <Circle
                center={geofenceCenter}
                radius={geofenceConfig.radius}
                strokeColor={FLEET_COLORS.primary}
                strokeWidth={2}
                fillColor={`${FLEET_COLORS.primary}22`}
              />
              <Marker coordinate={geofenceCenter} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.geofencePin}>
                  <View style={styles.geofencePinInner} />
                </View>
              </Marker>
            </>
          )}

          {vehicles.map((vehicle) => {
            if (!hasCoordinates(vehicle)) return null;
            const isSelected = vehicle.id === selectedVehicleId;
            const tone = statusTone(vehicle);
            return (
              <Marker
                key={vehicle.id}
                coordinate={vehicle.location}
                anchor={{ x: 0.5, y: 0.88 }}
                tracksViewChanges
                rotation={vehicle.direction}
                onPress={() => {
                  setSelectedVehicleId(vehicle.id);
                  onVehiclePress?.(vehicle);
                  animateToCoordinate(vehicle.location, vehicle.status === 'moving' ? 0.024 : 0.04);
                  announceVehicleFocus({
                    name: vehicle.name,
                    status: statusLabel(vehicle),
                    speed: vehicle.speed,
                    isOutsideFence: vehicle.isOutsideFence,
                  }).catch(() => undefined);
                }}
              >
                <VehicleMarker vehicle={vehicle} selected={isSelected} />
                <Callout tooltip>
                  <View style={styles.calloutCard}>
                    <View style={styles.calloutHeader}>
                      <View style={[styles.calloutStatus, { backgroundColor: `${tone}20`, borderColor: `${tone}55` }]}>
                        <View style={[styles.statusDot, { backgroundColor: tone }]} />
                        <Text style={[styles.calloutStatusText, { color: tone }]}>{statusLabel(vehicle)}</Text>
                      </View>
                      <Text style={styles.calloutName}>{vehicle.name}</Text>
                    </View>

                    <Text style={styles.calloutPlate}>{vehicle.licensePlate}</Text>

                    <View style={styles.calloutStatsRow}>
                      <StatLine label="Speed" value={`${Math.round(vehicle.speed)} km/h`} />
                      <StatLine label="Heading" value={`${Math.round(vehicle.direction)}°`} />
                    </View>
                    <View style={styles.calloutStatsRow}>
                      <StatLine label="Last seen" value={formatLastSeen(vehicle.lastSeen)} />
                      <StatLine
                        label="Fence"
                        value={vehicle.isOutsideFence ? 'Outside' : 'Inside'}
                        valueColor={vehicle.isOutsideFence ? FLEET_COLORS.orange : FLEET_COLORS.green}
                      />
                    </View>

                    <Text style={styles.calloutCoords}>
                      {vehicle.location.latitude.toFixed(5)}, {vehicle.location.longitude.toFixed(5)}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        <View style={styles.hud}>
          <View style={styles.hudCard}>
            <Text style={styles.hudLabel}>Live fleet</Text>
            <Text style={styles.hudValue}>{vehicles.length} tracked</Text>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudCard}>
            <Text style={styles.hudLabel}>In motion</Text>
            <Text style={[styles.hudValue, { color: FLEET_COLORS.green }]}>
              {vehicles.filter((vehicle) => vehicle.status === 'moving').length}
            </Text>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudCard}>
            <Text style={styles.hudLabel}>Fence alerts</Text>
            <Text style={[styles.hudValue, { color: FLEET_COLORS.orange }]}>
              {vehicles.filter((vehicle) => vehicle.isOutsideFence).length}
            </Text>
          </View>
        </View>

        {showSelectedVehicleCard && activeVehicle && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View>
                <Text style={styles.selectedLabel}>{selectedVehicle ? 'Selected vehicle' : 'Live highlight'}</Text>
                <Text style={styles.selectedTitle}>{activeVehicle.name}</Text>
              </View>
              <View style={[styles.selectedBadge, { borderColor: `${statusTone(activeVehicle)}55` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusTone(activeVehicle) }]} />
                <Text style={[styles.selectedBadgeText, { color: statusTone(activeVehicle) }]}>{statusLabel(activeVehicle)}</Text>
              </View>
            </View>

            <View style={styles.selectedStatsRow}>
              <SelectedStat label="Speed" value={`${Math.round(activeVehicle.speed)} km/h`} />
              <SelectedStat label="Sat" value={String(activeVehicle.satellites)} />
              <SelectedStat label="HDOP" value={activeVehicle.hdop.toFixed(1)} />
            </View>

            <Text style={styles.selectedCoords}>
              {activeVehicle.location.latitude.toFixed(5)}, {activeVehicle.location.longitude.toFixed(5)}
            </Text>
          </View>
        )}
      </View>
    );
  },
);

FleetMap.displayName = 'FleetMap';

function deltaToZoom(delta: number) {
  const safeDelta = Math.max(delta, 0.01);
  return Math.max(2, Math.min(20, Math.round(14 - Math.log10(safeDelta) * 3)));
}

function StatLine({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statLine}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function SelectedStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.selectedStat}>
      <Text style={styles.selectedStatLabel}>{label}</Text>
      <Text style={styles.selectedStatValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FLEET_COLORS.background,
  },
  geofencePin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: FLEET_COLORS.primary,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  geofencePinInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  calloutCard: {
    width: 230,
    borderRadius: 18,
    backgroundColor: '#0E1330',
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 10,
  },
  calloutHeader: {
    gap: 8,
  },
  calloutStatus: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  calloutStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  calloutName: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  calloutPlate: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  calloutStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statLine: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    gap: 4,
  },
  statLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  calloutCoords: {
    color: '#C9D1F2',
    fontSize: 11,
    fontWeight: '600',
  },
  hud: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: 'rgba(11,14,39,0.82)',
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  hudCard: {
    flex: 1,
    gap: 3,
  },
  hudLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hudValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  hudDivider: {
    width: 1,
    height: 24,
    backgroundColor: FLEET_COLORS.border,
  },
  selectedCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: 'rgba(11,14,39,0.92)',
    padding: 16,
    gap: 12,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectedLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  selectedTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  selectedStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  selectedStat: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  selectedStatLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  selectedStatValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  selectedCoords: {
    color: '#C9D1F2',
    fontSize: 12,
    fontWeight: '600',
  },
});
