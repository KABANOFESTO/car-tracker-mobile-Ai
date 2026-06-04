import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FLEET_COLORS } from '@/constants/theme';
import { TripReplay } from '@/constants/types';
import { TripReplayMap } from '@/components/replay/TripReplayMap';
import { getTripReplay } from '@/services/tripService';

export default function TripReplayScreenWeb() {
  const params = useLocalSearchParams<{ vehicleId: string; date: string }>();
  const [replay, setReplay] = useState<TripReplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const trip = await getTripReplay(params.vehicleId, params.date);
        if (cancelled) return;
        if (!trip) {
          setError('No trip points found for this day.');
        } else {
          setReplay(trip);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load trip replay');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [params.date, params.vehicleId]);

  useEffect(() => {
    if (!playing || !replay) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((current) => {
        if (current >= replay.points.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 700);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, replay]);

  const activePoint = replay?.points[activeIndex] ?? null;
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Trip Replay</Text>
          <Text style={styles.subtitle}>{params.date}</Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={FLEET_COLORS.primary} />
          <Text style={styles.empty}>Loading trip replay...</Text>
        </View>
      ) : error || !replay ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{error ?? 'Trip replay unavailable.'}</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TripReplayMap
            points={replay.points}
            activePoint={activePoint}
            onPointPress={(index) => {
              setPlaying(false);
              setActiveIndex(index);
            }}
          />

          <View style={styles.summaryRow}>
            <Stat value={`${replay.distanceKm.toFixed(1)} km`} label="Distance" />
            <Stat value={`${replay.durationMinutes} min`} label="Duration" />
            <Stat value={`${replay.maxSpeed.toFixed(0)} km/h`} label="Peak" />
            <Stat value={String(replay.outsideFenceMoments)} label="Breaches" />
          </View>

          <View style={styles.controlsCard}>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => setPlaying((current) => !current)}
                activeOpacity={0.85}
              >
                <Ionicons name={playing ? 'pause' : 'play'} size={18} color="#FFFFFF" />
                <Text style={styles.playText}>{playing ? 'Pause' : 'Play'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.seekButton}
                onPress={() => {
                  setPlaying(false);
                  setActiveIndex(0);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={16} color={FLEET_COLORS.primary} />
                <Text style={styles.seekText}>Restart</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.progressText}>
              Point {activeIndex + 1} of {replay.points.length} • {activePoint ? new Date(activePoint.timestamp).toLocaleTimeString() : ''}
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeline}>
              {replay.points.map((point, index) => {
                const active = index === activeIndex;
                return (
                  <TouchableOpacity
                    key={point.id}
                    style={[styles.timelineDot, active && styles.timelineDotActive]}
                    onPress={() => {
                      setPlaying(false);
                      setActiveIndex(index);
                    }}
                  >
                    <View style={[styles.timelineInner, point.isOutsideFence && styles.timelineInnerAlert]} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {activePoint ? (
            <View style={styles.pointCard}>
              <Text style={styles.pointTitle}>Selected moment</Text>
              <Text style={styles.pointBody}>
                {new Date(activePoint.timestamp).toLocaleString()} • {activePoint.latitude.toFixed(5)}, {activePoint.longitude.toFixed(5)}
              </Text>
              <Text style={styles.pointBody}>
                Speed {activePoint.speed.toFixed(1)} km/h • HDOP {activePoint.hdop.toFixed(2)} • Satellites {activePoint.satellites}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  safe: { backgroundColor: FLEET_COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border,
  },
  title: { color: FLEET_COLORS.textPrimary, fontSize: 22, fontWeight: '700' },
  subtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  empty: { color: FLEET_COLORS.textSecondary, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 12,
    gap: 4,
  },
  statValue: { color: FLEET_COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  statLabel: { color: FLEET_COLORS.textSecondary, fontSize: 11 },
  controlsCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 12,
  },
  controlsRow: { flexDirection: 'row', gap: 10 },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: FLEET_COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  seekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '55',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: FLEET_COLORS.primary + '14',
  },
  seekText: { color: FLEET_COLORS.primary, fontSize: 13, fontWeight: '600' },
  progressText: { color: FLEET_COLORS.textSecondary, fontSize: 12 },
  timeline: { gap: 8, paddingVertical: 4 },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: FLEET_COLORS.background,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    borderColor: FLEET_COLORS.primary,
    backgroundColor: FLEET_COLORS.primary + '22',
  },
  timelineInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FLEET_COLORS.green,
  },
  timelineInnerAlert: {
    backgroundColor: FLEET_COLORS.orange,
  },
  pointCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 6,
  },
  pointTitle: { color: FLEET_COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  pointBody: { color: FLEET_COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
});



