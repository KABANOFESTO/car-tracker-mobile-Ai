import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FLEET_COLORS } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';

export default function ChangePasswordScreen() {
  const { completePasswordChange, user } = useAuthSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hints = useMemo(
    () => [
      'Use at least 8 characters',
      'Choose a password only you know',
      'This will sign out other active sessions',
    ],
    []
  );

  async function handleSubmit() {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing details', 'Complete all password fields to continue.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'Use a password with at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'The new password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    try {
      await completePasswordChange(currentPassword, newPassword);
      router.replace((user?.role === 'admin' ? '/admin/users' : '/(tabs)') as never);
    } catch (error) {
      Alert.alert('Password update failed', error instanceof Error ? error.message : 'Unable to update your password right now.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="lock-closed-outline" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Change your temporary password</Text>
          <Text style={styles.subtitle}>
            Your administrator created this account for you. Set your own password before using FleetPulse.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Enter temporary password"
            placeholderTextColor={FLEET_COLORS.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>New password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Create a new password"
            placeholderTextColor={FLEET_COLORS.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Re-enter new password"
            placeholderTextColor={FLEET_COLORS.textSecondary}
            style={styles.input}
          />

          <View style={styles.hintList}>
            {hints.map((hint) => (
              <View key={hint} style={styles.hintRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={FLEET_COLORS.primary} />
                <Text style={styles.hintText}>{hint}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.submit} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Update password</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: FLEET_COLORS.background },
  container: { flex: 1, padding: 20, justifyContent: 'center', gap: 24 },
  hero: { gap: 10 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FLEET_COLORS.primary,
  },
  title: { color: FLEET_COLORS.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: FLEET_COLORS.textSecondary, fontSize: 14, lineHeight: 20, maxWidth: 340 },
  card: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 18,
    gap: 10,
  },
  label: { color: FLEET_COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    color: FLEET_COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  hintList: { gap: 8, marginTop: 8 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hintText: { color: FLEET_COLORS.textSecondary, fontSize: 12 },
  submit: {
    marginTop: 12,
    backgroundColor: FLEET_COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
