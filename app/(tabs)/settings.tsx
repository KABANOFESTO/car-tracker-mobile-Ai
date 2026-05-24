import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FLEET_COLORS } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useBackendSyncStatus } from '@/hooks/useBackendSyncStatus';

interface SettingRow {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}

const SETTINGS: SettingRow[] = [
  { icon: 'notifications-outline', label: 'Notifications', value: 'Enabled' },
  { icon: 'map-outline', label: 'Default Map Style', value: 'Dark' },
  { icon: 'refresh-outline', label: 'Update Interval', value: '15 seconds' },
  { icon: 'shield-checkmark-outline', label: 'Permissions', value: 'Location granted' },
];

const ABOUT: SettingRow[] = [
  { icon: 'information-circle-outline', label: 'Version', value: '1.0.0' },
  { icon: 'cloud-outline', label: 'ThingSpeak', value: 'Live polling (15s)' },
  { icon: 'document-text-outline', label: 'Privacy Policy' },
  { icon: 'help-circle-outline', label: 'Support' },
];

function SettingItem({ icon, label, value, onPress }: SettingRow) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon as any} size={18} color={FLEET_COLORS.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={14} color={FLEET_COLORS.border} />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, backendConfigured, signOut } = useAuthSession();
  const syncStatus = useBackendSyncStatus();

  const accountRows: SettingRow[] = [
    {
      icon: 'person-outline',
      label: user ? 'Signed in account' : 'Authentication',
      value: user ? `${user.name} (${user.role})` : backendConfigured ? 'Sign in required' : 'Backend not configured',
      onPress: () => {
        if (!backendConfigured) return;
        if (!user) router.push('/login' as never);
      },
    },
    {
      icon: 'cloud-done-outline',
      label: 'Backend sync',
      value: !backendConfigured
        ? 'Disabled'
        : syncStatus.isSyncing
          ? 'Syncing...'
          : syncStatus.lastError
            ? 'Attention needed'
            : syncStatus.lastSyncAt
              ? 'Connected'
              : 'Waiting',
    },
    {
      icon: 'time-outline',
      label: 'Last sync',
      value: syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleString() : 'No completed sync yet',
    },
  ];

  const adminRows: SettingRow[] = user?.role === 'admin'
    ? [
      {
        icon: 'people-outline',
        label: 'User access',
        value: 'Review owners and admins',
        onPress: () => router.push('/admin/users' as never),
      },
      {
        icon: 'server-outline',
        label: 'Operations logs',
        value: 'Requests, audit, and errors',
        onPress: () => router.push('/admin/logs' as never),
      },
    ]
    : [];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* App identity */}
        <View style={styles.appCard}>
          <View style={styles.appLogo}>
            <Ionicons name="navigate" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>FleetPulse</Text>
          <Text style={styles.appTagline}>Real-time IoT fleet tracking</Text>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.section}>
          {accountRows.map(item => <SettingItem key={item.label} {...item} />)}
        </View>

        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.section}>
          {SETTINGS.map(item => <SettingItem key={item.label} {...item} />)}
        </View>

        {adminRows.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>ADMIN</Text>
            <View style={styles.section}>
              {adminRows.map(item => <SettingItem key={item.label} {...item} />)}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.section}>
          {ABOUT.map(item => <SettingItem key={item.label} {...item} />)}
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          activeOpacity={0.8}
          onPress={() => {
            if (user) {
              signOut().catch(() => undefined);
              return;
            }
            if (backendConfigured) router.push('/login' as never);
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={FLEET_COLORS.orange} />
          <Text style={styles.signOutText}>{user ? 'Sign Out' : 'Sign In'}</Text>
        </TouchableOpacity>

        {syncStatus.lastError ? <Text style={styles.syncError}>{syncStatus.lastError}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FLEET_COLORS.background,
  },
  safe: {
    backgroundColor: FLEET_COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border,
  },
  title: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 4,
  },
  appCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
    gap: 6,
  },
  appLogo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: FLEET_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appName: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  appTagline: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
  },
  sectionLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: FLEET_COLORS.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.orange + '55',
    paddingVertical: 14,
    marginTop: 8,
  },
  signOutText: {
    color: FLEET_COLORS.orange,
    fontSize: 15,
    fontWeight: '600',
  },
  syncError: {
    color: FLEET_COLORS.orange,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});



