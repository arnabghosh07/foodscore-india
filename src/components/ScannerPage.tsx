'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false });
import ManualEntry from './ManualEntry';
import ScoreDisplay from './ScoreDisplay';
import HistoryList from './HistoryList';
import LoadingSpinner from './LoadingSpinner';
import NotFound from './NotFound';
import { lookupProduct } from '@/lib/api';
import { calculateFoodScore } from '@/lib/scoring';
import { getHistory, addToHistory, clearHistory } from '@/lib/history';
import { FoodScoreResult, ScanHistory } from '@/lib/types';

type ViewState = 'scanner' | 'loading' | 'results' | 'not-found' | 'error';

export default function ScannerPage() {
  const [viewState, setViewState] = useState<ViewState>('scanner');
  const [result, setResult] = useState<FoodScoreResult | null>(null);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  useEffect(() => { setHistory(getHistory()); }, []);
  const [currentBarcode, setCurrentBarcode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLookup = useCallback(async (barcode: string) => {
    setCurrentBarcode(barcode);
    setViewState('loading');
    setErrorMessage('');

    try {
      const product = await lookupProduct(barcode);

      if (!product) {
        setViewState('not-found');
        return;
      }

      const scoreResult = calculateFoodScore(product);
      setResult(scoreResult);
      setViewState('results');

      // Save to history
      addToHistory({
        barcode: product.code,
        productName: product.product_name,
        score: scoreResult.overallScore,
        grade: scoreResult.grade,
        timestamp: Date.now(),
        imageUrl: product.image_front_url,
      });
      setHistory(getHistory());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
      setViewState('error');
    }
  }, []);

  const handleBack = useCallback(() => {
    setResult(null);
    setViewState('scanner');
    setErrorMessage('');
  }, []);

  const handleHistorySelect = useCallback((barcode: string) => {
    handleLookup(barcode);
  }, [handleLookup]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  if (viewState === 'results' && result) {
    return <ScoreDisplay result={result} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FoodScore India</h1>
              <p className="text-xs text-gray-500">Scan & check your food&apos;s health</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {viewState === 'loading' && (
          <LoadingSpinner message={`Looking up barcode ${currentBarcode}...`} />
        )}

        {viewState === 'error' && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-sm text-gray-500 mb-4">{errorMessage}</p>
            <button
              onClick={handleBack}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {viewState === 'not-found' && (
          <NotFound barcode={currentBarcode} onRetry={handleBack} />
        )}

        {viewState === 'scanner' && (
          <>
            {/* Scanner Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Scan Barcode</h2>
              <p className="text-sm text-gray-500 mb-4">
                Point your camera at any food product barcode
              </p>
              <BarcodeScanner onScan={handleLookup} />
            </div>

            {/* Manual Entry */}
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <ManualEntry onSubmit={handleLookup} />
            </div>

            {/* Sample Barcodes */}
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Try these Indian products</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { barcode: '8901042011267', name: 'Maggi Noodles' },
                  { barcode: '8901135001023', name: 'Amul Butter' },
                  { barcode: '8901058001158', name: 'Haldiram Aloo Bhujia' },
                  { barcode: '8906004735109', name: 'Bournvita' },
                  { barcode: '8901063033508', name: 'Kissan Jam' },
                ].map((item) => (
                  <button
                    key={item.barcode}
                    onClick={() => handleLookup(item.barcode)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700 transition"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-6">
                <HistoryList
                  history={history}
                  onSelect={handleHistorySelect}
                  onClear={handleClearHistory}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
