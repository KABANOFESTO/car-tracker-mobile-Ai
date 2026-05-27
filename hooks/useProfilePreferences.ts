import { useEffect, useMemo, useState } from 'react';
import {
  ACCENT_THEME_PRESETS,
  ProfileAvatarId,
  ProfilePreferences,
  getDefaultProfilePreferences,
  getStoredProfilePreferences,
  persistProfilePreferences,
} from '@/services/profilePreferencesService';

export function useProfilePreferences(userId?: string | null) {
  const [preferences, setPreferences] = useState<ProfilePreferences>(getDefaultProfilePreferences());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      if (!userId) {
        setPreferences(getDefaultProfilePreferences());
        setLoading(false);
        return;
      }

      setLoading(true);
      const stored = await getStoredProfilePreferences(userId);
      if (!cancelled) {
        setPreferences(stored);
        setLoading(false);
      }
    }

    loadPreferences().catch(() => {
      if (!cancelled) {
        setPreferences(getDefaultProfilePreferences());
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function updatePreferences(next: Partial<ProfilePreferences>) {
    const merged = { ...preferences, ...next };
    setPreferences(merged);
    if (userId) {
      await persistProfilePreferences(userId, merged);
    }
  }

  async function setAvatarId(avatarId: ProfileAvatarId) {
    await updatePreferences({ avatarId });
  }

  async function setAccentTheme(accentTheme: ProfilePreferences['accentTheme']) {
    await updatePreferences({ accentTheme });
  }

  const accent = useMemo(() => ACCENT_THEME_PRESETS[preferences.accentTheme], [preferences.accentTheme]);

  return {
    preferences,
    accent,
    loading,
    setAvatarId,
    setAccentTheme,
  };
}
