'use client';

export default function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin" />
      </div>
      {message && (
        <p className="mt-4 text-gray-500 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
}
