import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FLEET_COLORS } from '@/constants/theme';
import { AuthUser } from '@/constants/types';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useProfilePreferences } from '@/hooks/useProfilePreferences';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { createAdminUser, fetchAdminUsers, updateAdminUser } from '@/services/backendApiService';

function SummaryTile({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}) {
  return (
    <View style={styles.summaryTile}>
      <View style={[styles.summaryIcon, { backgroundColor: tint + '18', borderColor: tint + '38' }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function AdminUsersScreen() {
  const { user: currentUser } = useAuthSession();
  const { preferences, accent } = useProfilePreferences(currentUser?.id);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'owner' as 'owner' | 'admin' });
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const response = await fetchAdminUsers();
      setUsers(response.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const totals = useMemo(() => {
    const admins = users.filter((entry) => entry.role === 'admin').length;
    const owners = users.filter((entry) => entry.role === 'owner').length;
    const inactive = users.filter((entry) => entry.active === false).length;
    const pendingPasswords = users.filter((entry) => entry.mustChangePassword).length;

    return {
      admins,
      owners,
      inactive,
      pendingPasswords,
    };
  }, [users]);

  async function handleCreateUser() {
    if (!form.name.trim() || !form.email.trim()) {
      Alert.alert('Missing details', 'Enter the full name and email before creating a user.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createAdminUser({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim() || undefined,
        active: true,
      });
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'owner' });
      await loadUsers(true);
      Alert.alert(
        'User created',
        `Credentials were emailed to ${result.credentialDelivery.recipient}. The user will be required to change their password on first sign in.`
      );
    } catch (err) {
      Alert.alert('User creation failed', err instanceof Error ? err.message : 'Unable to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(nextUser: AuthUser & { active?: boolean }) {
    try {
      await updateAdminUser(nextUser.id, { active: nextUser.active === false ? true : false });
      await loadUsers(true);
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Unable to update user');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadUsers(true)} tintColor={accent.primary} />}
      >
        <View style={styles.heroCard}>
          <View style={[styles.heroGlow, { backgroundColor: accent.primary + '32' }]} />
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>Admin Workspace</Text>
              <Text style={styles.heroTitle}>User Access</Text>
              <Text style={styles.heroSubtitle}>
                Create owners, create admins, and monitor account readiness from one clean control surface.
              </Text>
            </View>
            <ProfileAvatar avatarId={preferences.avatarId} name={currentUser?.name} size={58} />
          </View>

          <View style={styles.summaryGrid}>
            <SummaryTile label="Admins" value={totals.admins} icon="shield-checkmark-outline" tint={accent.primary} />
            <SummaryTile label="Owners" value={totals.owners} icon="people-outline" tint={accent.secondary} />
            <SummaryTile label="Inactive" value={totals.inactive} icon="pause-circle-outline" tint={FLEET_COLORS.orange} />
            <SummaryTile label="Password Pending" value={totals.pendingPasswords} icon="key-outline" tint={accent.highlight} />
          </View>

          <TouchableOpacity style={[styles.createButton, { backgroundColor: accent.primary }]} onPress={() => setShowCreate(true)} activeOpacity={0.86}>
            <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create user</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color={accent.primary} style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error ? (
          <View style={styles.userList}>
            {users.map((entry) => (
              <View key={entry.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.identityWrap}>
                    <ProfileAvatar avatarId={preferences.avatarId} name={entry.name} size={46} showBadge={false} />
                    <View style={styles.identityText}>
                      <Text style={styles.name}>{entry.name}</Text>
                      <Text style={styles.email}>{entry.email}</Text>
                    </View>
                  </View>
                  <View style={[styles.roleBadge, entry.role === 'admin' ? styles.adminBadge : styles.ownerBadge]}>
                    <Text style={styles.roleBadgeText}>{entry.role}</Text>
                  </View>
                </View>

                <View style={styles.metaGrid}>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>Status</Text>
                    <Text style={styles.metaValue}>{entry.active === false ? 'Inactive' : 'Active'}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>Password</Text>
                    <Text style={styles.metaValue}>{entry.mustChangePassword ? 'Pending change' : 'Secured'}</Text>
                  </View>
                </View>

                {entry.onboardingEmailSentAt ? (
                  <View style={styles.noticeRow}>
                    <Ionicons name="mail-open-outline" size={15} color={accent.secondary} />
                    <Text style={styles.noticeText}>Credentials sent {new Date(entry.onboardingEmailSentAt).toLocaleString()}</Text>
                  </View>
                ) : null}

                <TouchableOpacity style={styles.actionButton} onPress={() => toggleActive(entry)} activeOpacity={0.85}>
                  <Ionicons
                    name={entry.active === false ? 'checkmark-circle-outline' : 'pause-circle-outline'}
                    size={16}
                    color={FLEET_COLORS.textPrimary}
                  />
                  <Text style={styles.actionButtonText}>{entry.active === false ? 'Activate account' : 'Deactivate account'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create user</Text>
            <Text style={styles.modalSubtitle}>
              FleetPulse emails first-login credentials automatically. Leave the password blank to generate a secure temporary password.
            </Text>
            <TextInput
              value={form.name}
              onChangeText={(name) => setForm((current) => ({ ...current, name }))}
              placeholder="Full name"
              placeholderTextColor={FLEET_COLORS.textSecondary}
              style={styles.input}
            />
            <TextInput
              value={form.email}
              onChangeText={(email) => setForm((current) => ({ ...current, email }))}
              placeholder="Email address"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={FLEET_COLORS.textSecondary}
              style={styles.input}
            />
            <TextInput
              value={form.password}
              onChangeText={(password) => setForm((current) => ({ ...current, password }))}
              placeholder="Optional temporary password"
              secureTextEntry
              placeholderTextColor={FLEET_COLORS.textSecondary}
              style={styles.input}
            />
            <View style={styles.roleRow}>
              {(['owner', 'admin'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleButton, form.role === role && { borderColor: accent.primary, backgroundColor: accent.primary + '18' }]}
                  onPress={() => setForm((current) => ({ ...current, role }))}
                >
                  <Text style={[styles.roleButtonText, form.role === role && { color: accent.primary }]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: accent.primary }]} onPress={handleCreateUser} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  content: { padding: 16, gap: 16, paddingBottom: 36 },
  heroCard: {
    overflow: 'hidden',
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 18,
    gap: 16,
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -20,
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroEyebrow: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    marginTop: 4,
    color: FLEET_COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginTop: 8,
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 260,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryTile: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 8,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
  },
  createButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  loading: { marginTop: 48 },
  error: { color: FLEET_COLORS.orange, marginTop: 20, textAlign: 'center' },
  userList: { gap: 12 },
  card: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 16,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  identityWrap: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  identityText: {
    flex: 1,
    gap: 4,
  },
  name: { color: FLEET_COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  email: { color: FLEET_COLORS.textSecondary, fontSize: 13 },
  roleBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  adminBadge: { backgroundColor: FLEET_COLORS.primary + '22' },
  ownerBadge: { backgroundColor: FLEET_COLORS.orange + '22' },
  roleBadgeText: { color: FLEET_COLORS.textPrimary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  metaGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaPill: {
    flex: 1,
    minWidth: 120,
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 12,
    gap: 3,
  },
  metaLabel: { color: FLEET_COLORS.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.9 },
  metaValue: { color: FLEET_COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeText: { color: FLEET_COLORS.textSecondary, fontSize: 12.5 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.background,
    paddingVertical: 12,
  },
  actionButtonText: { color: FLEET_COLORS.textPrimary, fontWeight: '700', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#040817B8',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 18,
    gap: 12,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: FLEET_COLORS.border,
  },
  modalTitle: { color: FLEET_COLORS.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalSubtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  input: {
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    color: FLEET_COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: FLEET_COLORS.background,
  },
  roleButtonText: { color: FLEET_COLORS.textSecondary, fontWeight: '700', textTransform: 'capitalize' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { paddingHorizontal: 14, paddingVertical: 12 },
  cancelButtonText: { color: FLEET_COLORS.textSecondary, fontWeight: '700' },
  saveButton: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minWidth: 96,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800' },
});
