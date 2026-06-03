import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { FLEET_COLORS } from '@/constants/theme';
import { TripPoint } from '@/constants/types';

interface Props {
  points: TripPoint[];
  activePoint: TripPoint | null;
  onPointPress?: (index: number) => void;
}

const DEFAULT_REGION: Region = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export function TripReplayMap({ points, activePoint, onPointPress }: Props) {
  const mapRef = useRef<MapView | null>(null);

  const livePoints = useMemo(() => points.filter((point) => point.latitude !== 0 || point.longitude !== 0), [points]);
  const activeIndex = useMemo(() => {
    if (!activePoint) return -1;
    return points.findIndex((point) => point.id === activePoint.id);
  }, [activePoint, points]);
  const initialRegion = useMemo(() => {
    if (activePoint) {
      return {
        latitude: activePoint.latitude,
        longitude: activePoint.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
    }

    if (livePoints.length > 0) {
      const latitudes = livePoints.map((point) => point.latitude);
      const longitudes = livePoints.map((point) => point.longitude);
      const latitude = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
      const longitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
      const latitudeDelta = Math.max(0.015, Math.abs(Math.max(...latitudes) - Math.min(...latitudes)) * 1.4 || 0.03);
      const longitudeDelta = Math.max(0.015, Math.abs(Math.max(...longitudes) - Math.min(...longitudes)) * 1.4 || 0.03);
      return { latitude, longitude, latitudeDelta, longitudeDelta };
    }

    return DEFAULT_REGION;
  }, [activePoint, livePoints]);

  useEffect(() => {
    if (!activePoint) return;
    mapRef.current?.animateToRegion(
      {
        latitude: activePoint.latitude,
        longitude: activePoint.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      350,
    );
  }, [activePoint?.id]);

  if (points.length === 0) return null;

  return (
    <View style={styles.mapCard}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heroLabel}>Trip Path</Text>
          <Text style={styles.heroTitle}>Interactive replay map</Text>
        </View>
        <View style={styles.countPill}>
          <Ionicons name="pulse" size={12} color={FLEET_COLORS.primary} />
          <Text style={styles.countText}>{points.length} points</Text>
        </View>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        customMapStyle={DARK_MAP_STYLE}
        showsCompass={false}
        showsScale={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled
      >
        {livePoints.length > 1 && (
          <Polyline
            coordinates={livePoints.map((point) => ({ latitude: point.latitude, longitude: point.longitude }))}
            strokeColor={FLEET_COLORS.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {livePoints.map((point, index) => {
          const isActive = index === activeIndex;
          const isStart = index === 0;
          const isEnd = index === livePoints.length - 1;
          const tone = point.isOutsideFence ? FLEET_COLORS.orange : isActive ? FLEET_COLORS.primary : FLEET_COLORS.green;

          return (
            <Marker
              key={point.id}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => onPointPress?.(index)}
            >
              <View style={[styles.pointOuter, isActive && styles.pointOuterActive]}>
                <View style={[styles.pointInner, { backgroundColor: tone }]} />
                {(isStart || isEnd) && (
                  <View style={[styles.pointBadge, isStart ? styles.startBadge : styles.endBadge]}>
                    <Text style={styles.pointBadgeText}>{isStart ? 'Start' : 'End'}</Text>
                  </View>
                )}
              </View>

              <Callout>
                <View style={styles.calloutCard}>
                  <Text style={styles.calloutTitle}>{isActive ? 'Current replay point' : 'Trip point'}</Text>
                  <Text style={styles.calloutBody}>{new Date(point.timestamp).toLocaleString()}</Text>
                  <Text style={styles.calloutBody}>
                    {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                  </Text>
                  <Text style={styles.calloutBody}>
                    Speed {point.speed.toFixed(1)} km/h · HDOP {point.hdop.toFixed(2)}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.metricsRow}>
        <Metric label="Points" value={String(points.length)} />
        <Metric
          label="Current"
          value={activePoint ? `${activePoint.latitude.toFixed(3)}, ${activePoint.longitude.toFixed(3)}` : 'N/A'}
        />
        <Metric label="Alert pts" value={String(points.filter((point) => point.isOutsideFence).length)} />
      </View>

      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Replay guidance</Text>
        <Text style={styles.timelineBody}>
          Tap a marker on the route to jump the replay to that moment. The line shows the exact vehicle path and the markers highlight the start, end, and outside-fence points.
        </Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0B0E27' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#AEB7D6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0E27' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2D3561' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#182042' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2D3561' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#11183A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#091122' }] },
];

const styles = StyleSheet.create({
  mapCard: {
    minHeight: 380,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.surface,
    padding: 14,
    gap: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroLabel: {
    color: FLEET_COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: FLEET_COLORS.primary + '14',
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '30',
  },
  countText: {
    color: FLEET_COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  map: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pointOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pointOuterActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderColor: FLEET_COLORS.primary,
    backgroundColor: `${FLEET_COLORS.primary}20`,
  },
  pointInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pointBadge: {
    position: 'absolute',
    top: -24,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
  },
  startBadge: {
    backgroundColor: `${FLEET_COLORS.green}20`,
    borderColor: `${FLEET_COLORS.green}55`,
  },
  endBadge: {
    backgroundColor: `${FLEET_COLORS.orange}20`,
    borderColor: `${FLEET_COLORS.orange}55`,
  },
  pointBadgeText: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  calloutCard: {
    width: 220,
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#0E1330',
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
  },
  calloutTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  calloutBody: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: FLEET_COLORS.background,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    gap: 4,
  },
  metricLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  timelineCard: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: FLEET_COLORS.background,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    gap: 4,
  },
  timelineTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  timelineBody: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
