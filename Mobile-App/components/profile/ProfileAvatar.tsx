import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PROFILE_AVATAR_PRESETS, ProfileAvatarId } from '@/services/profilePreferencesService';

function initialsFromName(name?: string | null) {
  if (!name?.trim()) return 'FP';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'FP';
}

export function ProfileAvatar({
  avatarId,
  name,
  size = 52,
  showBadge = true,
}: {
  avatarId: ProfileAvatarId;
  name?: string | null;
  size?: number;
  showBadge?: boolean;
}) {
  const preset = PROFILE_AVATAR_PRESETS[avatarId];
  const initials = initialsFromName(name);
  const iconSize = Math.max(12, Math.round(size * 0.24));

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: preset.background,
          borderColor: preset.border,
          shadowColor: preset.glow,
        },
      ]}
    >
      <Text style={[styles.initials, { color: preset.foreground, fontSize: Math.max(14, Math.round(size * 0.28)) }]}>
        {initials}
      </Text>
      {showBadge ? (
        <View style={[styles.badge, { backgroundColor: preset.foreground }]}>
          <Ionicons name={preset.icon} size={iconSize} color={preset.background} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  initials: {
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  badge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B0E27',
  },
});
