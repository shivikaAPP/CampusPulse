import { useState, useEffect, useCallback } from 'react';

export function isStorageAvailable(): boolean {
  try {
    const testKey = '__cp_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function clearAllCampusPlusData(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('cp.v1.')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore storage clear failure
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validator?: (value: unknown) => value is T
): [T, (valOrUpdater: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      const parsed = JSON.parse(item);
      if (validator && !validator(parsed)) {
        return initialValue;
      }
      return parsed as T;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (valOrUpdater: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof valOrUpdater === 'function' ? (valOrUpdater as (prev: T) => T)(prev) : valOrUpdater;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Fall back to keeping in-memory state
        }
        return next;
      });
    },
    [key]
  );

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) {
        try {
          if (event.newValue === null) {
            setStoredValue(initialValue);
          } else {
            const parsed = JSON.parse(event.newValue);
            if (!validator || validator(parsed)) {
              setStoredValue(parsed as T);
            }
          }
        } catch {
          setStoredValue(initialValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, initialValue, validator]);

  return [storedValue, setValue];
}
