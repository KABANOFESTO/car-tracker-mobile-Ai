import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { FLEET_COLORS } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useProfilePreferences } from '@/hooks/useProfilePreferences';

function LogoutTabButton({
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

export default function TabLayout() {
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
        name="index"
        options={{
          title: 'Fleet',
          tabBarIcon: ({ color, size }) => <Ionicons name="car-sport-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="intelligence"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="geofence"
        options={{
          title: 'Zones',
          tabBarIcon: ({ color, size }) => <Ionicons name="radio-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: () => <ProfileAvatar avatarId={preferences.avatarId} name={user?.name} size={28} showBadge={false} />,
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: user ? 'Logout' : 'Sign In',
          tabBarButton: ({ accessibilityState }) => (
            <LogoutTabButton
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
