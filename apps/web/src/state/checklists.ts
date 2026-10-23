import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

export type ChecklistsMap = Record<string, string[]>;

function isValidChecklists(obj: unknown): obj is ChecklistsMap {
  if (!obj || typeof obj !== 'object') return false;
  const map = obj as Record<string, unknown>;
  return Object.values(map).every(
    (arr) => Array.isArray(arr) && arr.every((item) => typeof item === 'string')
  );
}

export function useChecklists() {
  const [checklists, setChecklists] = useLocalStorage<ChecklistsMap>(
    'cp.v1.checklists',
    {},
    isValidChecklists
  );

  const getCompletedTasks = useCallback(
    (opportunityId: string): string[] => {
      return checklists[opportunityId] || [];
    },
    [checklists]
  );

  const toggleTask = useCallback(
    (opportunityId: string, taskId: string) => {
      setChecklists((prev) => {
        const current = prev[opportunityId] || [];
        const nextTasks = current.includes(taskId)
          ? current.filter((id) => id !== taskId)
          : [...current, taskId];
        return {
          ...prev,
          [opportunityId]: nextTasks,
        };
      });
    },
    [setChecklists]
  );

  return {
    checklists,
    getCompletedTasks,
    toggleTask,
  };
}
