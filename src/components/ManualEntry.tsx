'use client';

import { useState } from 'react';

interface ManualEntryProps {
  onSubmit: (barcode: string) => void;
}

export default function ManualEntry({ onSubmit }: ManualEntryProps) {
  const [barcode, setBarcode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onSubmit(barcode.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Or enter barcode manually
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="e.g. 8901042011267"
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm"
          pattern="[0-9]+"
          inputMode="numeric"
        />
        <button
          type="submit"
          disabled={!barcode.trim()}
          className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium text-sm disabled:opacity-40 hover:bg-gray-800 transition"
        >
          Look Up
        </button>
      </div>
    </form>
  );
}
