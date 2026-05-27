import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProfileAvatarId = 'pulse' | 'orbit' | 'summit' | 'ember' | 'forest';
export type AccentThemeId = 'midnight' | 'ocean' | 'carbon';

export interface ProfilePreferences {
  avatarId: ProfileAvatarId;
  accentTheme: AccentThemeId;
}

const STORAGE_PREFIX = 'fleetpulse:profile-preferences:';

const DEFAULT_PREFERENCES: ProfilePreferences = {
  avatarId: 'pulse',
  accentTheme: 'midnight',
};

export const PROFILE_AVATAR_PRESETS: Record<
  ProfileAvatarId,
  {
    label: string;
    background: string;
    foreground: string;
    border: string;
    glow: string;
    icon: 'sparkles' | 'planet' | 'shield-checkmark' | 'flame' | 'leaf';
  }
> = {
  pulse: {
    label: 'Pulse',
    background: '#4F6EF7',
    foreground: '#FFFFFF',
    border: '#95A8FF',
    glow: '#4F6EF766',
    icon: 'sparkles',
  },
  orbit: {
    label: 'Orbit',
    background: '#13B5C8',
    foreground: '#07151D',
    border: '#7EE8F3',
    glow: '#13B5C855',
    icon: 'planet',
  },
  summit: {
    label: 'Summit',
    background: '#C9D4E6',
    foreground: '#1B223D',
    border: '#FFFFFF',
    glow: '#C9D4E655',
    icon: 'shield-checkmark',
  },
  ember: {
    label: 'Ember',
    background: '#FF7043',
    foreground: '#FFFFFF',
    border: '#FFB39B',
    glow: '#FF704355',
    icon: 'flame',
  },
  forest: {
    label: 'Forest',
    background: '#39B56A',
    foreground: '#FFFFFF',
    border: '#94E1B0',
    glow: '#39B56A55',
    icon: 'leaf',
  },
};

export const ACCENT_THEME_PRESETS: Record<
  AccentThemeId,
  {
    label: string;
    primary: string;
    secondary: string;
    highlight: string;
  }
> = {
  midnight: {
    label: 'Midnight',
    primary: '#4F6EF7',
    secondary: '#7C91FF',
    highlight: '#A6B7FF',
  },
  ocean: {
    label: 'Ocean',
    primary: '#13B5C8',
    secondary: '#58D6E4',
    highlight: '#9AEDF6',
  },
  carbon: {
    label: 'Carbon',
    primary: '#9AA4B2',
    secondary: '#C7D0DB',
    highlight: '#E6EBF2',
  },
};

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getDefaultProfilePreferences(): ProfilePreferences {
  return DEFAULT_PREFERENCES;
}

export async function getStoredProfilePreferences(userId: string): Promise<ProfilePreferences> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return DEFAULT_PREFERENCES;

  try {
    const parsed = JSON.parse(raw) as Partial<ProfilePreferences>;
    return {
      avatarId: parsed.avatarId ?? DEFAULT_PREFERENCES.avatarId,
      accentTheme: parsed.accentTheme ?? DEFAULT_PREFERENCES.accentTheme,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function persistProfilePreferences(userId: string, preferences: ProfilePreferences): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(preferences));
}
