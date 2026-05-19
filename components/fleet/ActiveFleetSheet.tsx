import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Vehicle } from '@/constants/types';
import { VehicleStats } from '@/hooks/useVehicles';
import { VehicleCard } from './VehicleCard';
import { FLEET_COLORS } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.55;
const SHEET_MIN_HEIGHT = 120;
const HEADER_HEIGHT = 60;

type FilterTab = 'all' | 'moving' | 'offline';

interface Props {
  vehicles: Vehicle[];
  stats: VehicleStats;
}

export function ActiveFleetSheet({ vehicles, stats }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expanded, setExpanded] = useState(false);
  const animHeight = useRef(new Animated.Value(SHEET_MIN_HEIGHT)).current;
  const lastHeight = useRef(SHEET_MIN_HEIGHT);

  const toggleExpand = useCallback(() => {
    const targetHeight = expanded ? SHEET_MIN_HEIGHT : SHEET_MAX_HEIGHT;
    setExpanded(!expanded);
    lastHeight.current = targetHeight;
    Animated.spring(animHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
      damping: 18,
      stiffness: 160,
    }).start();
  }, [expanded, animHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const newHeight = Math.max(
          SHEET_MIN_HEIGHT,
          Math.min(SHEET_MAX_HEIGHT, lastHeight.current - g.dy)
        );
        animHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, g) => {
        const shouldExpand = g.vy < -0.5 || lastHeight.current - g.dy > SHEET_MAX_HEIGHT / 2;
        const targetHeight = shouldExpand ? SHEET_MAX_HEIGHT : SHEET_MIN_HEIGHT;
        lastHeight.current = targetHeight;
        setExpanded(shouldExpand);
        Animated.spring(animHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          damping: 18,
          stiffness: 160,
        }).start();
      },
    })
  ).current;

  const filtered = vehicles.filter(v => {
    if (activeTab === 'all') return true;
    if (activeTab === 'moving') return v.status === 'moving';
    if (activeTab === 'offline') return v.status === 'offline' || v.status === 'idle';
    return true;
  });

  return (
    <Animated.View style={[styles.sheet, { height: animHeight }]}>
      {/* Drag handle */}
      <View {...panResponder.panHandlers} style={styles.handleArea}>
        <View style={styles.handle} />
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryTitle}>Active Fleet</Text>
            <Text style={styles.summarySubtitle}>
              {stats.total} vehicles · currently tracking
            </Text>
          </View>
          <TouchableOpacity onPress={toggleExpand} style={styles.expandBtn}>
            <Ionicons
              name={expanded ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={FLEET_COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {/* Status pills */}
        <View style={styles.pillsRow}>
          <View style={styles.pill}>
            <View style={[styles.pillDot, { backgroundColor: FLEET_COLORS.green }]} />
            <Text style={styles.pillText}>{stats.moving} Moving</Text>
          </View>
          <View style={styles.pill}>
            <View style={[styles.pillDot, { backgroundColor: FLEET_COLORS.orange }]} />
            <Text style={styles.pillText}>{stats.idle} Idle</Text>
          </View>
          <View style={styles.pill}>
            <View style={[styles.pillDot, { backgroundColor: FLEET_COLORS.textSecondary }]} />
            <Text style={styles.pillText}>{stats.offline} Offline</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['all', 'moving', 'offline'] as FilterTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'all' ? `All (${stats.total})` :
               tab === 'moving' ? `Moving (${stats.moving})` :
               `Offline (${stats.offline + stats.idle})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Vehicle list */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {filtered.map(v => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            onFocusMap={vehicle =>
              router.push({
                pathname: '/(tabs)/map',
                params: { lat: vehicle.location.latitude, lng: vehicle.location.longitude },
              })
            }
            onOpenDetails={vehicle =>
              router.push({ pathname: '/vehicle/[id]', params: { id: vehicle.id } })
            }
          />
        ))}
        {filtered.length === 0 && (
          <Text style={styles.empty}>No vehicles in this category</Text>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: FLEET_COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: FLEET_COLORS.border,
    overflow: 'hidden',
  },
  handleArea: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: FLEET_COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  summarySubtitle: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  expandBtn: {
    padding: 6,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 20,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: FLEET_COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: FLEET_COLORS.primary,
  },
  tabText: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    color: FLEET_COLORS.primary,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  empty: {
    color: FLEET_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
});
