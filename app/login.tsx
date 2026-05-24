import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FLEET_COLORS } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { requestBackendPasswordReset } from '@/services/backendApiService';

export default function LoginScreen() {
  const { signIn, backendConfigured } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Unable to sign in right now.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the user email address first so the reset instructions go to the right inbox.');
      return;
    }

    setSendingReset(true);
    try {
      await requestBackendPasswordReset(email.trim());
      Alert.alert('Reset email sent', 'If this account exists and is active, FleetPulse has sent password reset instructions.');
    } catch (error) {
      Alert.alert('Reset failed', error instanceof Error ? error.message : 'Unable to start password reset right now.');
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="shield-checkmark-outline" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Secure Fleet Access</Text>
          <Text style={styles.subtitle}>Sign in to monitor vehicles, receive protected alerts, and manage your fleet according to your role.</Text>
        </View>

        <View style={styles.card}>
          {!backendConfigured ? (
            <View style={styles.notice}>
              <Ionicons name="warning-outline" size={18} color={FLEET_COLORS.orange} />
              <Text style={styles.noticeText}>Backend access is not configured on this device. Set the backend URL before signing in.</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="owner@example.com"
            placeholderTextColor={FLEET_COLORS.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
            placeholderTextColor={FLEET_COLORS.textSecondary}
            style={styles.input}
          />

          <TouchableOpacity style={styles.submit} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={handleForgotPassword} disabled={sendingReset} activeOpacity={0.75}>
            {sendingReset ? <ActivityIndicator color={FLEET_COLORS.primary} /> : <Text style={styles.secondaryActionText}>Send password reset email</Text>}
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
  subtitle: { color: FLEET_COLORS.textSecondary, fontSize: 14, lineHeight: 20, maxWidth: 320 },
  card: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 18,
    gap: 10,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: FLEET_COLORS.orange + '12',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.orange + '55',
    padding: 12,
    marginBottom: 4,
  },
  noticeText: {
    flex: 1,
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
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
  submit: {
    marginTop: 10,
    backgroundColor: FLEET_COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryAction: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryActionText: {
    color: FLEET_COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
