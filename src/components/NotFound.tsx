'use client';

interface NotFoundProps {
  barcode?: string;
  onRetry: () => void;
}

export default function NotFound({ barcode, onRetry }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
      {barcode && (
        <p className="text-sm text-gray-500 mb-1">Barcode: {barcode}</p>
      )}
      <p className="text-sm text-gray-400 text-center max-w-xs mb-6">
        This product is not in the Open Food Facts database yet. Indian products may have limited coverage.
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition"
      >
        Try Another Barcode
      </button>
    </div>
  );
}
