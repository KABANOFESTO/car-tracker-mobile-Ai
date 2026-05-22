import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FLEET_COLORS } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';

export default function LoginScreen() {
  const { signIn } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.back();
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Unable to sign in right now.');
    } finally {
      setSubmitting(false);
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
          <Text style={styles.subtitle}>Sign in to sync your fleet, receive owner-scoped incidents, and manage the system safely.</Text>
        </View>

        <View style={styles.card}>
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
});
