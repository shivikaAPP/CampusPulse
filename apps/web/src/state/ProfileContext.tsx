import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Profile } from '@campusplus/shared';
import { useLocalStorage, isStorageAvailable, clearAllCampusPlusData } from './useLocalStorage.js';

export const DEFAULT_PROFILE: Profile = {
  displayName: '',
  college: '',
  city: '',
  year: null,
  skills: [],
  interests: [],
  level: null,
  preferredMode: null,
  maxBudget: null,
};

function isValidProfile(obj: unknown): obj is Profile {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Partial<Profile>;
  return Array.isArray(p.skills) && Array.isArray(p.interests);
}

interface ProfileContextValue {
  profile: Profile;
  updateProfile: (profileOrUpdater: Profile | ((prev: Profile) => Profile)) => void;
  resetAllData: () => void;
  isStorageSupported: boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useLocalStorage<Profile>(
    'cp.v1.profile',
    DEFAULT_PROFILE,
    isValidProfile
  );

  const isStorageSupported = useMemo(() => isStorageAvailable(), []);

  const resetAllData = () => {
    clearAllCampusPlusData();
    setProfile(DEFAULT_PROFILE);
    window.location.reload();
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile: setProfile,
        resetAllData,
        isStorageSupported,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return ctx;
}
