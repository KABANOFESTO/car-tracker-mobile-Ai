import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
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
import { useVoiceGuidance } from '@/hooks/useVoiceGuidance';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ACCENT_THEME_PRESETS, PROFILE_AVATAR_PRESETS } from '@/services/profilePreferencesService';

function InfoPill({
  icon,
  label,
  value,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <View style={[styles.infoPill, { borderColor: tint + '44', backgroundColor: tint + '15' }]}>
      <Ionicons name={icon} size={15} color={tint} />
      <View style={styles.infoPillTextWrap}>
        <Text style={styles.infoPillLabel}>{label}</Text>
        <Text style={styles.infoPillValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent: string;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.actionIcon, { backgroundColor: accent + '18', borderColor: accent + '38' }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View style={styles.actionBody}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={FLEET_COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, backendConfigured, signOut } = useAuthSession();
  const syncStatus = useBackendSyncStatus();
  const { preferences, accent, setAvatarId, setAccentTheme } = useProfilePreferences(user?.id);
  const { enabled: voiceEnabled, loading: voiceLoading, setEnabled: setVoiceEnabled, announceAlertVoice } = useVoiceGuidance();
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
    if (!user) {
      if (backendConfigured) router.push('/login' as never);
      return;
    }

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
          <Text style={styles.headerEyebrow}>Account Center</Text>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
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

          <Text style={styles.heroName}>{user?.name ?? 'Guest user'}</Text>
          <Text style={styles.heroMeta}>
            {user ? `${user.email}  •  ${user.role.toUpperCase()}` : backendConfigured ? 'Sign in required' : 'Backend not configured'}
          </Text>

          <View style={styles.heroPills}>
            <InfoPill
              icon="shield-checkmark-outline"
              label="Security"
              value={user?.mustChangePassword ? 'Password change pending' : 'Protected'}
              tint={accent.primary}
            />
            <InfoPill
              icon="cloud-done-outline"
              label="Backend"
              value={syncLabel}
              tint={syncStatus.lastError ? FLEET_COLORS.orange : accent.secondary}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: accent.primary, shadowColor: accent.primary }]}
            onPress={() => (user ? router.push('/change-password' as never) : router.push('/login' as never))}
            activeOpacity={0.86}
          >
            <Ionicons name={user ? 'lock-closed-outline' : 'log-in-outline'} size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{user ? 'Change password' : 'Sign in to continue'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionSubtitle}>Pick a theme accent that shapes your account space and navigation.</Text>
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
                  <Text style={styles.themeState}>{active ? 'Active' : 'Tap to apply'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <ActionRow
            icon="person-circle-outline"
            title="Profile details"
            subtitle="Review email, role, session status, and security markers"
            onPress={() => setShowProfileModal(true)}
            accent={accent.primary}
          />
          <ActionRow
            icon="key-outline"
            title="Change password"
            subtitle="Update your password and keep account access secure"
            onPress={() => router.push('/change-password' as never)}
            accent={accent.secondary}
          />
          <ActionRow
            icon="image-outline"
            title="Profile image style"
            subtitle="Choose the avatar look that appears across your workspace"
            onPress={() => setShowAvatarModal(true)}
            accent={accent.highlight}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusTile}>
              <Text style={styles.statusLabel}>Backend URL</Text>
              <Text style={styles.statusValue}>{backendConfigured ? 'Configured' : 'Missing'}</Text>
            </View>
            <View style={styles.statusTile}>
              <Text style={styles.statusLabel}>Last Sync</Text>
              <Text style={styles.statusValue}>
                {syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleTimeString() : 'Pending'}
              </Text>
            </View>
            <View style={styles.statusTile}>
              <Text style={styles.statusLabel}>Session</Text>
              <Text style={styles.statusValue}>{user ? 'Authenticated' : 'Guest mode'}</Text>
            </View>
            <View style={styles.statusTile}>
              <Text style={styles.statusLabel}>Role</Text>
              <Text style={styles.statusValue}>{user?.role ?? 'none'}</Text>
            </View>
          </View>
          {syncStatus.lastError ? <Text style={styles.errorText}>{syncStatus.lastError}</Text> : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Voice Guidance</Text>
          <Text style={styles.sectionSubtitle}>
            Professional spoken guidance for alerts, vehicle focus, and map actions. It helps the owner react faster without staring at the screen.
          </Text>
          <View style={styles.voiceRow}>
            <View style={styles.voiceTextWrap}>
              <Text style={styles.voiceLabel}>{voiceLoading ? 'Loading...' : voiceEnabled ? 'Enabled' : 'Disabled'}</Text>
              <Text style={styles.voiceHint}>
                {voiceEnabled
                  ? 'The app will speak important alerts and map selections.'
                  : 'No spoken guidance will be played until you turn it back on.'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.voiceToggle, voiceEnabled && styles.voiceToggleOn]}
              onPress={() => setVoiceEnabled(!voiceEnabled)}
              activeOpacity={0.85}
              disabled={voiceLoading}
            >
              <Ionicons name={voiceEnabled ? 'volume-high' : 'volume-mute'} size={16} color={voiceEnabled ? '#fff' : FLEET_COLORS.primary} />
              <Text style={[styles.voiceToggleText, voiceEnabled && styles.voiceToggleTextOn]}>
                {voiceEnabled ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.voicePreviewBtn, { borderColor: accent.primary + '55', backgroundColor: accent.primary + '12' }]}
            onPress={() =>
              announceAlertVoice({
                title: 'Voice guidance test',
                vehicleName: user?.name ?? 'Fleet owner',
                description: 'The app is ready to speak alerts, map selections, and trip replay moments.',
                severity: 'info',
              }).catch(() => undefined)
            }
            activeOpacity={0.85}
          >
            <Ionicons name="mic-outline" size={16} color={accent.primary} />
            <Text style={[styles.voicePreviewText, { color: accent.primary }]}>Play test voice</Text>
          </TouchableOpacity>
        </View>

        {user?.role === 'admin' ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Admin Workspace</Text>
            <ActionRow
              icon="people-outline"
              title="User access management"
              subtitle="Create owners, create admins, and control account activation"
              onPress={() => router.push('/admin/users' as never)}
              accent={accent.primary}
            />
            <ActionRow
              icon="server-outline"
              title="Operations logs"
              subtitle="Review request, audit, and error activity from the backend"
              onPress={() => router.push('/admin/logs' as never)}
              accent={accent.secondary}
            />
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: FLEET_COLORS.orange + '55', backgroundColor: FLEET_COLORS.orange + '12' }]}
          onPress={handleSignOut}
          activeOpacity={0.85}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color={FLEET_COLORS.orange} />
          ) : (
            <>
              <Ionicons name={user ? 'log-out-outline' : 'log-in-outline'} size={19} color={FLEET_COLORS.orange} />
              <Text style={styles.logoutText}>{user ? 'Sign out securely' : 'Sign in'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showProfileModal} transparent animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setShowProfileModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHandle} />
            <ProfileAvatar avatarId={preferences.avatarId} name={user?.name} size={82} />
            <Text style={styles.modalName}>{user?.name ?? 'Guest user'}</Text>
            <Text style={styles.modalEmail}>{user?.email ?? 'No authenticated session'}</Text>
            <View style={styles.modalList}>
              <View style={styles.modalRow}>
                <Text style={styles.modalRowLabel}>Role</Text>
                <Text style={styles.modalRowValue}>{user?.role ?? 'none'}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalRowLabel}>Account status</Text>
                <Text style={styles.modalRowValue}>{user?.active === false ? 'Inactive' : 'Active'}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalRowLabel}>Password state</Text>
                <Text style={styles.modalRowValue}>{user?.mustChangePassword ? 'Must change password' : 'Up to date'}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalRowLabel}>Theme</Text>
                <Text style={styles.modalRowValue}>{accent.label}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.modalPrimaryButton, { backgroundColor: accent.primary }]}
              onPress={() => {
                setShowProfileModal(false);
                router.push('/change-password' as never);
              }}
            >
              <Text style={styles.modalPrimaryButtonText}>Manage security</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showAvatarModal} transparent animationType="slide" onRequestClose={() => setShowAvatarModal(false)}>
        <View style={styles.modalScrim}>
          <View style={[styles.modalCard, styles.avatarModalCard]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalName}>Choose profile image style</Text>
            <Text style={styles.modalEmail}>A polished avatar system keeps the app production-ready without broken uploads.</Text>
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
                    <Text style={styles.avatarChoiceState}>{active ? 'Selected' : 'Tap to use'}</Text>
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
  screen: {
    flex: 1,
    backgroundColor: FLEET_COLORS.background,
  },
  safe: {
    backgroundColor: FLEET_COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 14 : 14,
    paddingBottom: 10,
  },
  headerEyebrow: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    marginTop: 4,
    color: FLEET_COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    overflow: 'hidden',
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 20,
    gap: 14,
  },
  heroGlow: {
    position: 'absolute',
    top: -30,
    right: -10,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editAvatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroName: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroMeta: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  heroPills: {
    gap: 10,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infoPillTextWrap: {
    flex: 1,
  },
  infoPillLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoPillValue: {
    marginTop: 2,
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 15,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: -6,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: 96,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.background,
    padding: 12,
    gap: 10,
  },
  themeSwatches: {
    flexDirection: 'row',
    gap: 6,
  },
  themeSwatch: {
    flex: 1,
    height: 10,
    borderRadius: 999,
  },
  themeLabel: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  themeState: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: FLEET_COLORS.background,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: {
    flex: 1,
    gap: 3,
  },
  actionTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusTile: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 130,
    borderRadius: 18,
    backgroundColor: FLEET_COLORS.background,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 6,
  },
  statusLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: FLEET_COLORS.orange,
    fontSize: 12,
    lineHeight: 18,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voiceTextWrap: {
    flex: 1,
    gap: 4,
  },
  voiceLabel: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  voiceHint: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  voiceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  voiceToggleOn: {
    backgroundColor: FLEET_COLORS.primary,
    borderColor: FLEET_COLORS.primary,
  },
  voiceToggleText: {
    color: FLEET_COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  voiceToggleTextOn: {
    color: '#FFFFFF',
  },
  voicePreviewBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
  },
  voicePreviewText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 2,
  },
  logoutText: {
    color: FLEET_COLORS.orange,
    fontSize: 15,
    fontWeight: '700',
  },
  modalScrim: {
    flex: 1,
    backgroundColor: '#040817B8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 20,
    alignItems: 'center',
    gap: 14,
  },
  avatarModalCard: {
    alignItems: 'stretch',
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: FLEET_COLORS.border,
  },
  modalName: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalEmail: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  modalList: {
    width: '100%',
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    overflow: 'hidden',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border,
  },
  modalRowLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
  },
  modalRowValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  modalPrimaryButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarChoice: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 132,
    backgroundColor: FLEET_COLORS.background,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  avatarChoiceLabel: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  avatarChoiceState: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
  },
  modalSecondaryButton: {
    alignSelf: 'center',
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  modalSecondaryButtonText: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
