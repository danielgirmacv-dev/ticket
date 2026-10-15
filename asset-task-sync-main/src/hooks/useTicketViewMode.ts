import { useEffect, useState } from 'react';

export type TicketViewMode = 'cards' | 'list';

const STORAGE_KEY = 'ecc-tickets-view-mode';

export function useTicketViewMode() {
  const [viewMode, setViewMode] = useState<TicketViewMode>(() => {
    if (typeof window === 'undefined') return 'cards';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'list' ? 'list' : 'cards';
    } catch {
      return 'cards';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  return { viewMode, setViewMode };
}
