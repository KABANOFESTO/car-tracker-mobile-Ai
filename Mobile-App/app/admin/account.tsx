import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FLEET_COLORS } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useBackendSyncStatus } from '@/hooks/useBackendSyncStatus';
import { useProfilePreferences } from '@/hooks/useProfilePreferences';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ACCENT_THEME_PRESETS, PROFILE_AVATAR_PRESETS } from '@/services/profilePreferencesService';

export default function AdminAccountScreen() {
  const { user, signOut, backendConfigured } = useAuthSession();
  const syncStatus = useBackendSyncStatus();
  const { preferences, accent, setAccentTheme, setAvatarId } = useProfilePreferences(user?.id);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const syncLabel = useMemo(() => {
    if (!backendConfigured) return 'Backend unavailable';
    if (syncStatus.isSyncing) return 'Syncing fleet state';
    if (syncStatus.lastError) return 'Sync attention needed';
    if (syncStatus.lastSyncAt) return 'Connected to backend';
    return 'Waiting for first sync';
  }, [backendConfigured, syncStatus.isSyncing, syncStatus.lastError, syncStatus.lastSyncAt]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  async function handleThemeChange(themeId: keyof typeof ACCENT_THEME_PRESETS) {
    try {
      await setAccentTheme(themeId);
    } catch {
      Alert.alert('Theme update failed', 'Unable to save this appearance option right now.');
    }
  }

  async function handleAvatarChange(avatarId: keyof typeof PROFILE_AVATAR_PRESETS) {
    try {
      await setAvatarId(avatarId);
      setShowAvatarModal(false);
    } catch {
      Alert.alert('Avatar update failed', 'Unable to save this avatar right now.');
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Admin Account</Text>
          <Text style={styles.headerTitle}>Profile & Controls</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={[styles.heroGlow, { backgroundColor: accent.primary + '35' }]} />
          <View style={styles.heroTopRow}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setShowProfileModal(true)}>
              <ProfileAvatar avatarId={preferences.avatarId} name={user?.name} size={76} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editAvatarButton, { borderColor: accent.primary + '55', backgroundColor: accent.primary + '12' }]}
              onPress={() => setShowAvatarModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={16} color={accent.primary} />
              <Text style={[styles.editAvatarText, { color: accent.primary }]}>Edit avatar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heroName}>{user?.name ?? 'Admin user'}</Text>
          <Text style={styles.heroMeta}>
            {user ? `${user.email} | ${user.role.toUpperCase()}` : 'No authenticated admin session'}
          </Text>

          <View style={styles.heroPills}>
            <View style={[styles.infoPill, { borderColor: accent.primary + '44', backgroundColor: accent.primary + '15' }]}>
              <Ionicons name="shield-checkmark-outline" size={15} color={accent.primary} />
              <Text style={styles.infoPillValue}>{user?.mustChangePassword ? 'Password change pending' : 'Protected'}</Text>
            </View>
            <View style={[styles.infoPill, { borderColor: accent.secondary + '44', backgroundColor: accent.secondary + '15' }]}>
              <Ionicons name="cloud-done-outline" size={15} color={accent.secondary} />
              <Text style={styles.infoPillValue}>{syncLabel}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: accent.primary, shadowColor: accent.primary }]}
            onPress={() => router.push('/change-password' as never)}
            activeOpacity={0.86}
          >
            <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Change password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Admin Actions</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/admin/users' as never)} activeOpacity={0.85}>
            <Text style={styles.actionTitle}>Manage users</Text>
            <Ionicons name="chevron-forward" size={16} color={FLEET_COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/admin/logs' as never)} activeOpacity={0.85}>
            <Text style={styles.actionTitle}>View operations logs</Text>
            <Ionicons name="chevron-forward" size={16} color={FLEET_COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.themeGrid}>
            {Object.entries(ACCENT_THEME_PRESETS).map(([themeId, theme]) => {
              const active = preferences.accentTheme === themeId;
              return (
                <TouchableOpacity
                  key={themeId}
                  style={[styles.themeCard, active && { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]}
                  onPress={() => handleThemeChange(themeId as keyof typeof ACCENT_THEME_PRESETS)}
                  activeOpacity={0.85}
                >
                  <View style={styles.themeSwatches}>
                    <View style={[styles.themeSwatch, { backgroundColor: theme.primary }]} />
                    <View style={[styles.themeSwatch, { backgroundColor: theme.secondary }]} />
                    <View style={[styles.themeSwatch, { backgroundColor: theme.highlight }]} />
                  </View>
                  <Text style={styles.themeLabel}>{theme.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: FLEET_COLORS.orange + '55', backgroundColor: FLEET_COLORS.orange + '12' }]}
          onPress={handleSignOut}
          activeOpacity={0.85}
          disabled={signingOut}
        >
          {signingOut ? <ActivityIndicator color={FLEET_COLORS.orange} /> : <>
            <Ionicons name="log-out-outline" size={19} color={FLEET_COLORS.orange} />
            <Text style={styles.logoutText}>Sign out securely</Text>
          </>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showProfileModal} transparent animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setShowProfileModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHandle} />
            <ProfileAvatar avatarId={preferences.avatarId} name={user?.name} size={82} />
            <Text style={styles.modalName}>{user?.name ?? 'Admin user'}</Text>
            <Text style={styles.modalEmail}>{user?.email ?? 'No authenticated session'}</Text>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showAvatarModal} transparent animationType="slide" onRequestClose={() => setShowAvatarModal(false)}>
        <View style={styles.modalScrim}>
          <View style={[styles.modalCard, styles.avatarModalCard]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalName}>Choose profile image style</Text>
            <View style={styles.avatarGrid}>
              {Object.entries(PROFILE_AVATAR_PRESETS).map(([avatarId, preset]) => {
                const active = preferences.avatarId === avatarId;
                return (
                  <TouchableOpacity
                    key={avatarId}
                    style={[styles.avatarChoice, active && { borderColor: preset.background, backgroundColor: preset.background + '14' }]}
                    onPress={() => handleAvatarChange(avatarId as keyof typeof PROFILE_AVATAR_PRESETS)}
                    activeOpacity={0.85}
                  >
                    <ProfileAvatar avatarId={avatarId as keyof typeof PROFILE_AVATAR_PRESETS} name={user?.name} size={56} />
                    <Text style={styles.avatarChoiceLabel}>{preset.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setShowAvatarModal(false)}>
              <Text style={styles.modalSecondaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: FLEET_COLORS.background },
  safe: { backgroundColor: FLEET_COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  headerEyebrow: { color: FLEET_COLORS.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  headerTitle: { marginTop: 4, color: FLEET_COLORS.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  heroCard: { overflow: 'hidden', backgroundColor: FLEET_COLORS.surface, borderRadius: 28, borderWidth: 1, borderColor: FLEET_COLORS.border, padding: 20, gap: 14 },
  heroGlow: { position: 'absolute', top: -30, right: -10, width: 180, height: 180, borderRadius: 90, opacity: 0.8 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editAvatarButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  editAvatarText: { fontSize: 13, fontWeight: '700' },
  heroName: { color: FLEET_COLORS.textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  heroMeta: { color: FLEET_COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  heroPills: { gap: 10 },
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12 },
  infoPillValue: { color: FLEET_COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  primaryButton: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 15, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  sectionCard: { backgroundColor: FLEET_COLORS.surface, borderRadius: 22, borderWidth: 1, borderColor: FLEET_COLORS.border, padding: 18, gap: 14 },
  sectionTitle: { color: FLEET_COLORS.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, backgroundColor: FLEET_COLORS.background, borderWidth: 1, borderColor: FLEET_COLORS.border, padding: 14 },
  actionTitle: { color: FLEET_COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeCard: { flexBasis: '31%', flexGrow: 1, minWidth: 96, borderRadius: 18, borderWidth: 1, borderColor: FLEET_COLORS.border, backgroundColor: FLEET_COLORS.background, padding: 12, gap: 10 },
  themeSwatches: { flexDirection: 'row', gap: 6 },
  themeSwatch: { flex: 1, height: 10, borderRadius: 999 },
  themeLabel: { color: FLEET_COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderRadius: 18, paddingVertical: 16, marginTop: 2 },
  logoutText: { color: FLEET_COLORS.orange, fontSize: 15, fontWeight: '700' },
  modalScrim: { flex: 1, backgroundColor: '#040817B8', alignItems: 'center', justifyContent: 'center', padding: 18 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: FLEET_COLORS.surface, borderRadius: 28, borderWidth: 1, borderColor: FLEET_COLORS.border, padding: 20, alignItems: 'center', gap: 14 },
  avatarModalCard: { alignItems: 'stretch' },
  modalHandle: { width: 48, height: 5, borderRadius: 999, backgroundColor: FLEET_COLORS.border },
  modalName: { color: FLEET_COLORS.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  modalEmail: { color: FLEET_COLORS.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  avatarChoice: { flexBasis: '47%', flexGrow: 1, minWidth: 132, backgroundColor: FLEET_COLORS.background, borderWidth: 1, borderColor: FLEET_COLORS.border, borderRadius: 18, padding: 14, alignItems: 'center', gap: 8 },
  avatarChoiceLabel: { color: FLEET_COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  modalSecondaryButton: { alignSelf: 'center', marginTop: 4, paddingHorizontal: 18, paddingVertical: 10 },
  modalSecondaryButtonText: { color: FLEET_COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
});
