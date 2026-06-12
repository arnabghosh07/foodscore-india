import { ScanHistory } from './types';

const HISTORY_KEY = 'foodscore-history';
const MAX_HISTORY = 50;

export function getHistory(): ScanHistory[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToHistory(item: ScanHistory): void {
  if (typeof window === 'undefined') return;
  const history = getHistory();
  // Remove duplicate if exists
  const filtered = history.filter(h => h.barcode !== item.barcode);
  // Add to beginning
  filtered.unshift(item);
  // Limit size
  const trimmed = filtered.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

export function removeFromHistory(barcode: string): void {
  if (typeof window === 'undefined') return;
  const history = getHistory();
  const filtered = history.filter(h => h.barcode !== barcode);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}
