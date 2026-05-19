import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FLEET_COLORS } from '@/constants/theme';

interface SettingRow {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}

const SETTINGS: SettingRow[] = [
  { icon: 'person-outline', label: 'Account', value: 'fleet@example.com' },
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

function SettingItem({ icon, label, value }: SettingRow) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
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

        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.section}>
          {SETTINGS.map(item => <SettingItem key={item.label} {...item} />)}
        </View>

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.section}>
          {ABOUT.map(item => <SettingItem key={item.label} {...item} />)}
        </View>

        <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={FLEET_COLORS.orange} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
});
