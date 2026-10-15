import { useCallback, useState } from 'react';

export type TicketsViewMode = 'cards' | 'list';

const STORAGE_KEY = 'eec-tickets-view-mode';

function readStoredMode(): TicketsViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'list' ? 'list' : 'cards';
  } catch {
    return 'cards';
  }
}

export function useTicketsViewMode() {
  const [viewMode, setViewModeState] = useState<TicketsViewMode>(readStoredMode);

  const setViewMode = useCallback((mode: TicketsViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  return { viewMode, setViewMode };
}
