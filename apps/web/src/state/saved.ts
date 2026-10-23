import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

function isValidSaved(obj: unknown): obj is string[] {
  return Array.isArray(obj) && obj.every((id) => typeof id === 'string');
}

export function useSaved() {
  const [savedIds, setSavedIds] = useLocalStorage<string[]>(
    'cp.v1.saved',
    [],
    isValidSaved
  );

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  const toggleSave = useCallback(
    (id: string) => {
      setSavedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    },
    [setSavedIds]
  );

  return {
    savedIds,
    isSaved,
    toggleSave,
  };
}
