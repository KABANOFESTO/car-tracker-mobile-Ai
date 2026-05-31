import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { FLEET_COLORS } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useProfilePreferences } from '@/hooks/useProfilePreferences';

function AdminLogoutTab({
  color,
  label,
  onPress,
}: {
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.logoutButton} onPress={onPress}>
      <View style={[styles.logoutIconWrap, { backgroundColor: color + '18', borderColor: color + '30' }]}>
        <Ionicons name="log-out-outline" size={20} color={color} />
      </View>
      <Text style={[styles.logoutLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export default function AdminLayout() {
  const { user, signOut } = useAuthSession();
  const { preferences, accent } = useProfilePreferences(user?.id);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: accent.primary,
        tabBarInactiveTintColor: FLEET_COLORS.textSecondary,
        tabBarStyle: {
          height: 78,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: FLEET_COLORS.background,
          borderTopColor: FLEET_COLORS.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: () => <ProfileAvatar avatarId={preferences.avatarId} name={user?.name} size={28} showBadge={false} />,
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: user ? 'Logout' : 'Sign In',
          tabBarButton: ({ accessibilityState }) => (
            <AdminLogoutTab
              color={accessibilityState?.selected ? accent.primary : FLEET_COLORS.textSecondary}
              label={user ? 'Logout' : 'Sign In'}
              onPress={() => {
                if (user) {
                  signOut().catch(() => undefined);
                  return;
                }
                router.push('/login' as never);
              }}
            />
          ),
          tabBarIcon: ({ color, size }) => <Ionicons name="log-out-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoutLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
