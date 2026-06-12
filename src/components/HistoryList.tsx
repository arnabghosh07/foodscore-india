'use client';

import { ScanHistory } from '@/lib/types';

interface HistoryListProps {
  history: ScanHistory[];
  onSelect: (barcode: string) => void;
  onClear: () => void;
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return '#2ecc71';
    case 'B': return '#27ae60';
    case 'C': return '#f39c12';
    case 'D': return '#e67e22';
    case 'E': return '#e74c3c';
    default: return '#95a5a6';
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function HistoryList({ history, onSelect, onClear }: HistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500">No scans yet</p>
        <p className="text-sm text-gray-400 mt-1">Scan a barcode to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Recent Scans</h3>
        <button
          onClick={onClear}
          className="text-sm text-gray-400 hover:text-red-500 transition"
        >
          Clear all
        </button>
      </div>
      <div className="space-y-2">
        {history.map((item) => (
        <button
          key={item.barcode}
          onClick={() => onSelect(item.barcode)}
          className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition text-left"
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="w-12 h-12 rounded-lg object-contain bg-gray-50"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{item.productName}</p>
            <p className="text-xs text-gray-400">{item.barcode} · {formatDate(item.timestamp)}</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: getGradeColor(item.grade) }}
          >
            {item.grade}
          </div>
        </button>
      ))}
      </div>
    </div>
  );
}
