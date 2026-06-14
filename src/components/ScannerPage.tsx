'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false });
import ManualEntry from './ManualEntry';
import ScoreDisplay from './ScoreDisplay';
import HistoryList from './HistoryList';
import LoadingSpinner from './LoadingSpinner';
import NotFound from './NotFound';
import Footer from './Footer';
import { lookupProduct, ApiError } from '@/lib/api';
import { calculateFoodScore } from '@/lib/scoring';
import { getHistory, addToHistory, clearHistory } from '@/lib/history';
import { Product, FoodScoreResult, ScanHistory } from '@/lib/types';

type ViewState = 'scanner' | 'loading' | 'results' | 'search-results' | 'not-found' | 'error';

export default function ScannerPage() {
  const [viewState, setViewState] = useState<ViewState>('scanner');
  const [result, setResult] = useState<FoodScoreResult | null>(null);
  const [showAllSamples, setShowAllSamples] = useState(false);
  const [history, setHistory] = useState<ScanHistory[]>(() => getHistory());
  const [currentBarcode, setCurrentBarcode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<string>('unknown');
  // Prevent concurrent lookups caused by the scanner firing onScan multiple
  // times before stop() resolves (10fps → 3-5 duplicate callbacks on mobile).
  const isLookingUpRef = useRef(false);

  const handleLookup = useCallback(async (barcode: string) => {
    // Drop duplicate calls while a lookup is already in progress
    if (isLookingUpRef.current) return;
    isLookingUpRef.current = true;

    // Outer try/finally guarantees the lock is ALWAYS released —
    // even when we return early from an error, not-found, or exception.
    try {
      const cleanBarcode = barcode.trim();
      setCurrentBarcode(cleanBarcode);
      setViewState('loading');
      setErrorMessage('');

      // ── Step 1: Fetch product data ────────────────────────────────────────
      // This is the ONLY thing that can send us to the error screen.
      let product: Product | null = null;
      try {
        product = await lookupProduct(cleanBarcode);
      } catch (err) {
        setErrorType(err instanceof ApiError ? err.type : 'unknown');
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
        setViewState('error');
        return;
      }

      if (!product) {
        setViewState('not-found');
        return;
      }

      // ── Step 2: Score the product ─────────────────────────────────────────
      // Scoring is secondary — if it fails we still show the raw product data.
      let scoreResult: FoodScoreResult;
      try {
        scoreResult = calculateFoodScore(product);
      } catch {
        scoreResult = {
          dataSource: 'openfoodfacts',
          product,
          overallScore: 0,
          negativePoints: 0,
          positivePoints: 0,
          grade: '?',
          gradeColor: '#95a5a6',
          gradeLabel: 'Unavailable',
          novaGroup: product.nova_group ?? 4,
          novaLabel: 'Unknown',
          novaDescription: 'Processing level could not be determined.',
          novaScore: 0,
          nutrientScores: [],
          warnings: [],
          positives: [],
          feedback: 'Score unavailable — showing raw product data.',
          summary: product.product_name,
          scoringFailed: true,
        };
      }

      setResult(scoreResult);
      setViewState('results');

      // ── Step 3: Save to history ───────────────────────────────────────────
      try {
        addToHistory({
          barcode: product.code,
          productName: product.product_name,
          score: scoreResult.scoringFailed ? 0 : scoreResult.overallScore,
          grade: scoreResult.grade,
          timestamp: Date.now(),
          imageUrl: product.image_front_url,
        });
        setHistory(getHistory());
      } catch {
        // silently ignore history errors
      }
    } finally {
      // Always release — no matter which code path was taken
      isLookingUpRef.current = false;
    }
  }, []);

  const handleBack = useCallback(() => {
    // Also release the lookup lock in case we're returning from an error state
    isLookingUpRef.current = false;
    setResult(null);
    setErrorType('unknown');
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
    return <ScoreDisplay result={result} onBack={handleBack} onSelectProduct={handleLookup} />;
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
          <div className="py-12 text-center">
            {/* Contextual icon */}
            <div className={
              errorType === 'network' ? 'w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4' :
              errorType === 'timeout' ? 'w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4' :
              errorType === 'rate-limit' ? 'w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4' :
              errorType === 'http' ? 'w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4' :
              'w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4'
            }>
              {errorType === 'network' && (
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414M3 3l18 18" />
                </svg>
              )}
              {errorType === 'timeout' && (
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {errorType === 'rate-limit' && (
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {errorType === 'http' && (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              )}
              {errorType === 'unknown' && (
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>

            {/* Contextual heading */}
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {errorType === 'network' ? 'Connection Error' :
               errorType === 'timeout' ? 'Request Timed Out' :
               errorType === 'rate-limit' ? 'Too Many Requests' :
               errorType === 'http' ? 'Server Error' :
               'Something Went Wrong'}
            </h2>
            <p className="text-xs text-gray-400 mb-1">Barcode: {currentBarcode}</p>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{errorMessage}</p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => handleLookup(currentBarcode)}
                className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition shadow-sm"
              >
                Retry
              </button>
              <button
                onClick={handleBack}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
              >
                Try Another Barcode
              </button>
            </div>
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">Try Maggi products (verified)</h3>
                <button
                  onClick={() => setShowAllSamples(!showAllSamples)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-all"
                >
                  {showAllSamples ? 'Show less' : 'Show all 8'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { barcode: '8901058022193', name: '🍜 Maggi Noodles' },
                  { barcode: '8901719134852', name: '🍪 Parle-G Biscuit' },
                  { barcode: '8901063093522', name: '🍪 Britannia Good Day' },
                  { barcode: '8901063162914', name: '🥛 Marie Gold' },
                  { barcode: '8906010500764', name: '🫙 Balaji Wafers' },
                  { barcode: '8901491100519', name: '🌽 Kurkure' },
                  { barcode: '8902080000227', name: '⚡ Sting Energy' },
                  { barcode: '8901764042911', name: '🥤 Thums Up' },
                ]
                  .filter((_, i) => showAllSamples || i < 3)
                  .map((item) => (
                    <button
                      key={item.barcode}
                      onClick={() => handleLookup(item.barcode)}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700 transition"
                    >
                      {item.name}
                    </button>
                  ))}
                {!showAllSamples && (
                  <button
                    onClick={() => setShowAllSamples(true)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium transition"
                  >
                    +2 more
                  </button>
                )}
              </div>
              {!showAllSamples && (
                <p className="text-xs text-gray-400 mt-2">Showing 3 of 5 products</p>
              )}
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
            <Footer />
          </>
        )}
      </div>
    </div>
  );
}
