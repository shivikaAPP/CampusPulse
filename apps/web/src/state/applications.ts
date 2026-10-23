import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

export type ApplicationStatus = 'interested' | 'applied' | 'shortlisted' | 'completed';

export interface ApplicationEntry {
  status: ApplicationStatus;
  updatedAt: string;
}

export type ApplicationsMap = Record<string, ApplicationEntry>;

function isValidApplications(obj: unknown): obj is ApplicationsMap {
  if (!obj || typeof obj !== 'object') return false;
  const map = obj as Record<string, unknown>;
  const allowed = new Set(['interested', 'applied', 'shortlisted', 'completed']);
  return Object.values(map).every(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      allowed.has((entry as ApplicationEntry).status) &&
      typeof (entry as ApplicationEntry).updatedAt === 'string'
  );
}

export function useApplications() {
  const [applications, setApplications] = useLocalStorage<ApplicationsMap>(
    'cp.v1.applications',
    {},
    isValidApplications
  );

  const getApplicationStatus = useCallback(
    (id: string): ApplicationStatus | null => {
      return applications[id]?.status || null;
    },
    [applications]
  );

  const setApplicationStatus = useCallback(
    (id: string, status: ApplicationStatus | null) => {
      setApplications((prev) => {
        const next = { ...prev };
        if (status === null) {
          delete next[id];
        } else {
          next[id] = {
            status,
            updatedAt: new Date().toISOString(),
          };
        }
        return next;
      });
    },
    [setApplications]
  );

  return {
    applications,
    getApplicationStatus,
    setApplicationStatus,
  };
}
