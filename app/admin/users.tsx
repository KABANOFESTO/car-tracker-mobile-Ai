import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FLEET_COLORS } from '@/constants/theme';
import { AuthUser } from '@/constants/types';
import { createAdminUser, fetchAdminUsers, updateAdminUser } from '@/services/backendApiService';

export default function AdminUsersScreen() {
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

  async function handleCreateUser() {
    setSubmitting(true);
    try {
      const result = await createAdminUser({
        ...form,
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

  async function toggleActive(user: AuthUser & { active?: boolean }) {
    try {
      await updateAdminUser(user.id, { active: user.active === false ? true : false });
      await loadUsers(true);
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Unable to update user');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadUsers(true)} tintColor={FLEET_COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Access Control</Text>
          <Text style={styles.subtitle}>Review who can operate the fleet backend and incident workflow.</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
          <Text style={styles.createButtonText}>Create user</Text>
        </TouchableOpacity>

        {loading ? <ActivityIndicator color={FLEET_COLORS.primary} style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error ? users.map((user) => (
          <View key={user.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{user.name}</Text>
              <View style={[styles.badge, user.role === 'admin' ? styles.adminBadge : styles.ownerBadge]}>
                <Text style={styles.badgeText}>{user.role}</Text>
              </View>
            </View>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>{user.active === false ? 'Inactive' : 'Active'}</Text>
            <Text style={styles.meta}>
              {user.mustChangePassword ? 'Must change password on next sign in' : 'Password already secured by user'}
            </Text>
            {user.onboardingEmailSentAt ? (
              <Text style={styles.meta}>Credential email sent {new Date(user.onboardingEmailSentAt).toLocaleString()}</Text>
            ) : null}
            <TouchableOpacity style={styles.actionButton} onPress={() => toggleActive(user)} activeOpacity={0.85}>
              <Text style={styles.actionButtonText}>{user.active === false ? 'Activate' : 'Deactivate'}</Text>
            </TouchableOpacity>
          </View>
        )) : null}
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create user</Text>
            <Text style={styles.modalSubtitle}>
              FleetPulse will email first-login credentials automatically. Leave the password blank to generate a secure temporary password.
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
              placeholder="Email"
              autoCapitalize="none"
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
                  style={[styles.roleButton, form.role === role && styles.roleButtonActive]}
                  onPress={() => setForm((current) => ({ ...current, role }))}
                >
                  <Text style={[styles.roleButtonText, form.role === role && styles.roleButtonTextActive]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateUser} disabled={submitting}>
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
  content: { padding: 16, gap: 12 },
  header: { gap: 4, marginBottom: 8 },
  title: { color: FLEET_COLORS.textPrimary, fontSize: 22, fontWeight: '700' },
  subtitle: { color: FLEET_COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  createButton: {
    alignSelf: 'flex-start',
    backgroundColor: FLEET_COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createButtonText: { color: '#FFFFFF', fontWeight: '700' },
  loading: { marginTop: 40 },
  error: { color: FLEET_COLORS.orange, marginTop: 24, textAlign: 'center' },
  card: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: FLEET_COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  meta: { color: FLEET_COLORS.textSecondary, fontSize: 13 },
  actionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: { color: FLEET_COLORS.textPrimary, fontWeight: '600', fontSize: 12 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  adminBadge: { backgroundColor: FLEET_COLORS.primary + '22' },
  ownerBadge: { backgroundColor: FLEET_COLORS.orange + '22' },
  badgeText: { color: FLEET_COLORS.textPrimary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 16,
    gap: 12,
  },
  modalTitle: { color: FLEET_COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  modalSubtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  input: {
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    color: FLEET_COLORS.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleButtonActive: { borderColor: FLEET_COLORS.primary, backgroundColor: FLEET_COLORS.primary + '22' },
  roleButtonText: { color: FLEET_COLORS.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  roleButtonTextActive: { color: FLEET_COLORS.primary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelButtonText: { color: FLEET_COLORS.textSecondary, fontWeight: '600' },
  saveButton: {
    backgroundColor: FLEET_COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
