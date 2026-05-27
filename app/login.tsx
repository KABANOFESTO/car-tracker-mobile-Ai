import { FLEET_COLORS } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { requestBackendPasswordReset } from '@/services/backendApiService';
import { getBackendConfigSnapshot } from '@/services/backendConfigService';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Focused Input Wrapper ────────────────────────────────────────────────────
function FloatingInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function onFocus() {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  }
  function onBlur() {
    setFocused(false);
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  }

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [FLEET_COLORS.border, FLEET_COLORS.primary],
  });

  return (
    <View style={inputStyles.wrapper}>
      <Text style={[inputStyles.label, focused && inputStyles.labelFocused]}>{label}</Text>
      <Animated.View style={[inputStyles.inputBox, { borderColor }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize={autoCapitalize ?? 'none'}
          keyboardType={keyboardType ?? 'default'}
          placeholder={placeholder}
          placeholderTextColor={FLEET_COLORS.textSecondary + '80'}
          secureTextEntry={secureTextEntry}
          style={inputStyles.input}
        />
      </Animated.View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  labelFocused: { color: FLEET_COLORS.primary },
  inputBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: FLEET_COLORS.background,
    overflow: 'hidden',
  },
  input: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
});

export default function LoginScreen() {
  const { signIn, backendConfigured } = useAuthSession();
  const { resolvedBaseUrl } = getBackendConfigSnapshot();
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
      Alert.alert('Email required', 'Enter your email address above so we can send the reset link to the right inbox.');
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
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Top decoration ── */}
        <View style={styles.topGlow} pointerEvents="none" />

        <View style={styles.inner}>

          {/* ── Brand hero ── */}
          <View style={styles.hero}>
            {/* Logo mark */}
            <View style={styles.logoRing}>
              <View style={styles.logoInner}>
                <Ionicons name="shield-checkmark" size={30} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.brandText}>
              <Text style={styles.brandName}>FleetPulse</Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeLabel}>Fleet Management</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>

            {/* Backend warning */}
            {!backendConfigured && (
              <View style={styles.notice}>
                <Ionicons name="warning-outline" size={16} color={FLEET_COLORS.orange} />
                <Text style={styles.noticeText}>
                  Backend not configured on this device. Set `EXPO_PUBLIC_BACKEND_BASE_URL` before signing in.
                </Text>
              </View>
            )}

            {backendConfigured && (
              <View style={styles.notice}>
                <Ionicons name="server-outline" size={16} color={FLEET_COLORS.primary} />
                <Text style={styles.noticeText}>
                  Backend: {resolvedBaseUrl}
                </Text>
              </View>
            )}

            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            <View style={styles.fields}>
              <FloatingInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                keyboardType="email-address"
              />
              <FloatingInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            {/* Sign in button */}
            <TouchableOpacity
              style={[styles.submit, submitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.82}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.submitInner}>
                  <Text style={styles.submitText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.ghost}
              onPress={handleForgotPassword}
              disabled={sendingReset}
              activeOpacity={0.75}
            >
              {sendingReset ? (
                <ActivityIndicator color={FLEET_COLORS.primary} size="small" />
              ) : (
                <Text style={styles.ghostText}>Send password reset email</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Ionicons name="lock-closed-outline" size={12} color={FLEET_COLORS.textSecondary} />
            <Text style={styles.footerText}>Your session is encrypted end-to-end</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: FLEET_COLORS.background,
  },
  kav: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: FLEET_COLORS.primary,
    opacity: 0.08,
  },

  // ── Layout
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },

  // ── Hero
  hero: {
    alignItems: 'center',
    gap: 14,
  },
  logoRing: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FLEET_COLORS.primary + '18',
    borderWidth: 1.5,
    borderColor: FLEET_COLORS.primary + '40',
  },
  logoInner: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FLEET_COLORS.primary,
    // Subtle shadow for depth
    shadowColor: FLEET_COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  brandText: {
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  badgeLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tagline: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },

  // ── Card
  card: {
    width: '100%',
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 24,
    gap: 0,
    // Card shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  cardSub: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 20,
  },

  // Warning notice
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: FLEET_COLORS.orange + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.orange + '40',
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  // Fields
  fields: {
    gap: 16,
    marginBottom: 24,
  },

  // Submit button
  submit: {
    backgroundColor: FLEET_COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: FLEET_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: FLEET_COLORS.border,
  },
  dividerText: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },

  // Ghost / forgot password
  ghost: {
    borderWidth: 1.5,
    borderColor: FLEET_COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    color: FLEET_COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
  },
});
