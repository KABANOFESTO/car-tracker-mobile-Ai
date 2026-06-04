import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FLEET_COLORS } from '@/constants/theme';
import { TripPoint } from '@/constants/types';

interface Props {
  points: TripPoint[];
  activePoint: TripPoint | null;
  onPointPress?: (index: number) => void;
}

export function TripReplayMap({ points, activePoint, onPointPress }: Props) {
  const layout = useMemo(() => buildLayout(points), [points]);

  if (points.length === 0) return null;

  return (
    <View style={styles.mapCard}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heroLabel}>Trip Path</Text>
          <Text style={styles.heroTitle}>Clickable replay route</Text>
        </View>
        <View style={styles.countPill}>
          <Ionicons name="map" size={12} color={FLEET_COLORS.primary} />
          <Text style={styles.countText}>{points.length} points</Text>
        </View>
      </View>

      <View style={styles.canvas}>
        {layout.segments.map((segment, index) => (
          <View
            key={`segment-${index}`}
            style={[
              styles.segment,
              {
                left: segment.left,
                top: segment.top,
                width: segment.length,
                transform: [{ rotate: `${segment.angle}deg` }],
                backgroundColor: segment.highlight ? FLEET_COLORS.primary : FLEET_COLORS.green,
                opacity: segment.highlight ? 1 : 0.7,
              },
            ]}
          />
        ))}

        {layout.points.map((point, index) => {
          const isActive = activePoint?.id === point.id;
          const isStart = index === 0;
          const isEnd = index === layout.points.length - 1;
          const tone = point.isOutsideFence ? FLEET_COLORS.orange : isActive ? FLEET_COLORS.primary : FLEET_COLORS.green;

          return (
            <Pressable
              key={point.id}
              onPress={() => onPointPress?.(index)}
              style={[
                styles.point,
                { left: point.x - (isActive ? 8 : 6), top: point.y - (isActive ? 8 : 6), backgroundColor: tone },
                isActive && styles.pointActive,
              ]}
            >
              {(isStart || isEnd) && <View style={[styles.badge, isStart ? styles.badgeStart : styles.badgeEnd]} />}
              <Text style={styles.pointLabel}>{isStart ? 'S' : isEnd ? 'E' : ''}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Points" value={String(points.length)} />
        <Metric
          label="Current"
          value={activePoint ? `${activePoint.latitude.toFixed(5)}, ${activePoint.longitude.toFixed(5)}` : 'N/A'}
        />
      </View>

      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Tap a point to jump there</Text>
        <Text style={styles.timelineBody}>
          The route above is clickable on web. Mobile uses a native map with the same replay state and route data.
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

function buildLayout(points: TripPoint[]) {
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const width = 900;
  const height = 420;

  const projectedPoints = points.map((point) => {
    const x = project(point.latitude, minLat, maxLat, width);
    const y = height - project(point.longitude, minLng, maxLng, height);
    return { ...point, x, y };
  });

  const segments = projectedPoints.slice(0, -1).map((point, index) => {
    const next = projectedPoints[index + 1];
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return {
      left: point.x,
      top: point.y,
      length,
      angle,
      highlight: index === projectedPoints.length - 2,
    };
  });

  return { points: projectedPoints, segments };
}

function project(value: number, min: number, max: number, size: number) {
  if (Math.abs(max - min) < 0.00001) return size / 2;
  return 28 + ((value - min) / (max - min)) * (size - 56);
}

const styles = StyleSheet.create({
  mapCard: {
    minHeight: 360,
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
  canvas: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0B0E27',
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
  },
  segment: {
    position: 'absolute',
    height: 4,
    borderRadius: 999,
    transformOrigin: 'left center',
  },
  point: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pointActive: {
    width: 16,
    height: 16,
  },
  badge: {
    position: 'absolute',
    width: 28,
    height: 16,
    borderRadius: 999,
    top: -22,
    borderWidth: 1,
  },
  badgeStart: {
    backgroundColor: FLEET_COLORS.green + '22',
    borderColor: FLEET_COLORS.green + '55',
  },
  badgeEnd: {
    backgroundColor: FLEET_COLORS.orange + '22',
    borderColor: FLEET_COLORS.orange + '55',
  },
  pointLabel: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 8,
    fontWeight: '800',
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
