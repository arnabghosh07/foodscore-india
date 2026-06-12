'use client';

import { FoodScoreResult, NutrientScore, Nutriments } from '@/lib/types';
import { useState, useEffect } from 'react';
import ShareCard from './ShareCard';
import FoodChat from './FoodChat';
import { searchProducts } from '@/lib/api';
import { calculateFoodScore } from '@/lib/scoring';

interface ScoreDisplayProps {
  result: FoodScoreResult;
  onBack: () => void;
  onSelectProduct?: (barcode: string) => void;
}

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const circ = 2 * Math.PI * 54;
  const off = circ - (score / 100) * circ;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <circle cx="60" cy="60" r="54" stroke={color} strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{Math.round(score)}</span>
        <span className="text-sm text-gray-500">out of 100</span>
      </div>
    </div>
  );
}

function NutrientBar({ nutrient }: { nutrient: NutrientScore }) {
  const isNegativeNutrient = ['Sugar', 'Saturated Fat', 'Sodium'].includes(nutrient.name);
  const isGreen = nutrient.color === '#2ecc71';
  const isOrange = nutrient.color === '#f39c12';
  
  let isLeft = false;
  let widthPercent = 0;
  let barColor = nutrient.color;
  
  if (isNegativeNutrient) {
    if (isGreen) {
      isLeft = false;
      widthPercent = (nutrient.score / 10) * 50;
      barColor = '#10b981'; // Green
    } else {
      isLeft = true;
      widthPercent = ((10 - nutrient.score) / 10) * 50;
      barColor = isOrange ? '#f59e0b' : '#ef4444'; // Orange or Red
    }
  } else {
    if (isGreen || isOrange) {
      isLeft = false;
      widthPercent = (nutrient.score / 10) * 50;
      barColor = isGreen ? '#10b981' : '#f59e0b'; // Green or Orange
    } else {
      isLeft = true;
      widthPercent = ((10 - nutrient.score) / 10) * 50;
      barColor = '#ef4444'; // Red
    }
  }

  // Ensure widthPercent is bounded
  widthPercent = Math.max(0, Math.min(50, widthPercent));

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-sm font-medium text-gray-700">{nutrient.name}</div>
      <div className="flex-1">
        {/* Bi-directional bar container */}
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          {/* Middle dividing line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gray-300 z-10" />
          
          {/* Filled bar */}
          <div 
            className={`absolute h-full transition-all duration-700 ease-out ${
              isLeft ? 'right-1/2 rounded-l-full' : 'left-1/2 rounded-r-full'
            }`}
            style={{ 
              width: `${widthPercent}%`, 
              backgroundColor: barColor 
            }} 
          />
        </div>
      </div>
      <div className="w-20 text-right shrink-0">
        <span className="text-sm font-semibold" style={{ color: nutrient.color }}>
          {nutrient.value}{nutrient.unit}
        </span>
        <span className="text-xs text-gray-400 block font-normal">({nutrient.label})</span>
      </div>
    </div>
  );
}

/** Render a plain key-value row from raw nutriments when scored bars aren't available */
function RawNutrientRow({ label, value, unit }: { label: string; value?: number; unit: string }) {
  if (value == null || !isFinite(value)) return null;
  return (
    <div className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value.toFixed(1)} {unit}</span>
    </div>
  );
}

/** Show all available raw nutriment fields directly from the API response */
function RawNutritionPanel({ nutriments }: { nutriments: Nutriments }) {
  return (
    <div className="space-y-0">
      <RawNutrientRow label="Energy"         value={nutriments.energy_100g}        unit="kcal" />
      <RawNutrientRow label="Protein"        value={nutriments.proteins_100g}      unit="g" />
      <RawNutrientRow label="Carbohydrates"  value={nutriments.carbohydrates_100g} unit="g" />
      <RawNutrientRow label="Sugar"          value={nutriments.sugars_100g}        unit="g" />
      <RawNutrientRow label="Fat"            value={nutriments.fat_100g}           unit="g" />
      <RawNutrientRow label="Saturated Fat"  value={nutriments.saturated_fat_100g} unit="g" />
      <RawNutrientRow label="Fiber"          value={nutriments.fiber_100g}         unit="g" />
      <RawNutrientRow label="Sodium"         value={
        nutriments.sodium_100g != null
          ? Math.round(nutriments.sodium_100g * 1000)
          : undefined
      } unit="mg" />
    </div>
  );
}

export default function ScoreDisplay({ result, onBack, onSelectProduct }: ScoreDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'about'>('overview');
  const [dbAlternatives, setDbAlternatives] = useState<FoodScoreResult[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const { product, scoringFailed } = result;
  const nutriments = product.nutriments ?? {};

  useEffect(() => {
    let active = true;
    const fetchDbAlternatives = async () => {
      if (scoringFailed) return;
      setLoadingAlts(true);
      
      try {
        const name = (product.product_name + ' ' + (product.categories || '')).toLowerCase();
        let searchTerms: string[] = [];
        if (name.includes('noodle') || name.includes('maggi') || name.includes('ramen')) {
          searchTerms = ['atta noodles', 'millet noodles', 'oats noodles'];
        } else if (name.includes('biscuit') || name.includes('cookie')) {
          searchTerms = ['digestive biscuits', 'oats cookies', 'ragi biscuits'];
        } else if (name.includes('chip') || name.includes('kurkure') || name.includes('wafer') || name.includes('namkeen') || name.includes('potato') || name.includes('nacho')) {
          searchTerms = ['baked chips', 'millet chips', 'nachos ragi'];
        } else if (name.includes('drink') || name.includes('cola') || name.includes('soda') || name.includes('juice') || name.includes('beverage')) {
          searchTerms = ['coconut water', 'buttermilk chaas', 'diet soda'];
        } else if (name.includes('chocolate')) {
          searchTerms = ['dark chocolate 85', 'dark chocolate 70'];
        } else {
          searchTerms = ['roasted almonds', 'roasted makhana'];
        }

        const promises = searchTerms.map(term => 
          searchProducts(term).catch(() => [] as any[])
        );
        const searchResultsLists = await Promise.all(promises);
        
        if (!active) return;

        // Flatten lists
        const rawProducts = searchResultsLists.flat();
        
        const scored = rawProducts
          .map(p => {
            try {
              return calculateFoodScore(p);
            } catch (e) {
              return null;
            }
          })
          .filter((res): res is FoodScoreResult => {
            if (!res) return false;
            // Exclude current product
            if (res.product.code === product.code || res.product.product_name?.toLowerCase() === product.product_name?.toLowerCase()) {
              return false;
            }
            // Only suggest healthier alternatives
            if (res.overallScore <= result.overallScore) {
              return false;
            }
            // Must be a genuinely healthy product (Grade A or B, or at least a decent score >= 60)
            if (res.overallScore < 60) {
              return false;
            }

            // Strict category alignment check to make sure alternatives are of same category & similar purpose
            const altName = (res.product.product_name || '').toLowerCase();
            const altCats = (res.product.categories || '').toLowerCase();
            
            let isCategoryAligned = false;
            
            if (name.includes('noodle') || name.includes('maggi') || name.includes('ramen')) {
              const hasNoodleKeyword = altName.includes('noodle') || altName.includes('pasta') || altName.includes('vermicelli') || altCats.includes('noodle') || altCats.includes('pasta');
              const hasHealthyGrain = altName.includes('wheat') || altName.includes('atta') || altName.includes('millet') || altName.includes('ragi') || altName.includes('oat') || altName.includes('jowar') || altName.includes('baked');
              isCategoryAligned = hasNoodleKeyword && hasHealthyGrain;
            } else if (name.includes('biscuit') || name.includes('cookie')) {
              const hasBiscuitKeyword = altName.includes('biscuit') || altName.includes('cookie') || altCats.includes('biscuit') || altCats.includes('cookie');
              const hasHealthyGrain = altName.includes('digestive') || altName.includes('oat') || altName.includes('ragi') || altName.includes('multigrain') || altName.includes('wheat') || altName.includes('grain');
              isCategoryAligned = hasBiscuitKeyword && hasHealthyGrain;
            } else if (name.includes('chip') || name.includes('wafer') || name.includes('kurkure') || name.includes('potato') || name.includes('nacho')) {
              const hasSnackKeyword = altName.includes('chip') || altName.includes('nacho') || altName.includes('makhana') || altName.includes('chana') || altName.includes('popcorn') || altCats.includes('chip') || altCats.includes('snack');
              const hasHealthyPrep = altName.includes('baked') || altName.includes('roasted') || altName.includes('millet') || altName.includes('ragi') || altName.includes('diet') || altName.includes('chana') || altName.includes('makhana');
              isCategoryAligned = hasSnackKeyword && hasHealthyPrep;
            } else if (name.includes('drink') || name.includes('cola') || name.includes('soda') || name.includes('juice') || name.includes('beverage')) {
              const hasDrinkKeyword = altName.includes('drink') || altName.includes('water') || altName.includes('soda') || altName.includes('juice') || altName.includes('chaas') || altName.includes('buttermilk') || altName.includes('lassi') || altCats.includes('beverage') || altCats.includes('drink') || altCats.includes('juice');
              const hasHealthyType = altName.includes('coconut') || altName.includes('chaas') || altName.includes('buttermilk') || altName.includes('diet') || altName.includes('sugar free') || altName.includes('zero sugar') || altName.includes('aloe') || altName.includes('pure') || altName.includes('fresh');
              isCategoryAligned = hasDrinkKeyword && hasHealthyType;
            } else if (name.includes('chocolate')) {
              isCategoryAligned = (altName.includes('chocolate') || altCats.includes('chocolate')) && (altName.includes('dark') || altName.includes('85') || altName.includes('70') || altName.includes('90') || altName.includes('sugar free'));
            } else {
              // Default fallback: allow general category matching
              isCategoryAligned = true;
            }
            
            return isCategoryAligned;
          });

        // Deduplicate by name and brand
        const seen = new Set<string>();
        const uniqueScored: FoodScoreResult[] = [];
        for (const res of scored) {
          const key = `${res.product.product_name?.toLowerCase() || ''}_${res.product.brands?.toLowerCase() || ''}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueScored.push(res);
          }
        }

        // Sort by score descending and take top 3
        const finalAlts = uniqueScored
          .sort((a, b) => b.overallScore - a.overallScore)
          .slice(0, 3);

        setDbAlternatives(finalAlts);
      } catch (err) {
        console.error('Error fetching database alternatives:', err);
      } finally {
        if (active) setLoadingAlts(false);
      }
    };

    fetchDbAlternatives();
    return () => {
      active = false;
    };
  }, [product, result.overallScore, scoringFailed]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Health Score</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">

        {/* ── Product card (always shown, data from API) ── */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {product.image_front_url && (
            <img
              src={product.image_front_url}
              alt={product.product_name}
              className="w-full h-48 object-contain bg-gray-50 p-4"
            />
          )}
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-900">{product.product_name}</h2>
            {product.brands && (
              <p className="text-sm text-gray-500 mt-1">{product.brands}</p>
            )}
            {product.categories && (
              <p className="text-xs text-gray-400 mt-1">{product.categories}</p>
            )}
          </div>
        </div>

        {/* ── Score circle OR scoring-failed notice ── */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {scoringFailed ? (
            <div className="text-center py-2">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">Score unavailable</p>
              <p className="text-gray-400 text-xs mt-1">Product data loaded — health score could not be computed</p>
            </div>
          ) : (
            <>
              <ScoreCircle score={result.overallScore} color={result.gradeColor} />
              <div className="mt-4 text-center">
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: result.gradeColor }}
                >
                  {result.grade} — {result.gradeLabel}
                </span>
              </div>
              <p className="mt-4 text-center text-gray-600 text-sm leading-relaxed">{result.summary}</p>
            </>
          )}
        </div>

        {/* Share button — always shown */}
        <ShareCard result={result} />

        {/* ── Tabs ── */}
        <div className="mt-6 flex bg-gray-100 rounded-xl p-1">
          {(['overview', 'details', 'about'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">

          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <>
              {/* Red Flags */}
              {!scoringFailed && result.safetyRecommendation?.hasRedFlags && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-red-950 flex items-center gap-2 mb-2 text-base">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    CRITICAL RED FLAGS
                  </h3>
                  <ul className="space-y-2">
                    {result.safetyRecommendation.redFlags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-red-800 font-semibold flex items-start gap-1.5 leading-relaxed">
                        <span className="text-red-600 mt-0.5">•</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Portion Control & Safety Guidelines */}
              {!scoringFailed && result.safetyRecommendation && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Consumption Guidelines
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/40">
                      <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block mb-1">Recommended Portion</span>
                      <span className="text-sm font-semibold text-gray-800 leading-snug">
                        {result.safetyRecommendation.dailyLimit}
                      </span>
                    </div>
                    <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/40">
                      <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block mb-1">Weekly Frequency</span>
                      <span className="text-sm font-semibold text-gray-800 leading-snug">
                        {result.safetyRecommendation.weeklyFrequency}
                      </span>
                    </div>
                  </div>

                  {/* High Risk Groups */}
                  {result.safetyRecommendation.highRiskGroups.length > 0 && (
                    <div className="pt-3 border-t border-gray-50">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">Who should limit/avoid:</span>
                      <div className="flex flex-wrap gap-2">
                        {result.safetyRecommendation.highRiskGroups.map((group, idx) => {
                          let icon = '👥';
                          if (group.includes('Diabetics')) icon = '🍬';
                          else if (group.includes('Pregnant')) icon = '🤰';
                          else if (group.includes('Children')) icon = '👶';
                          else if (group.includes('Heart')) icon = '❤️';
                          else if (group.includes('Hypertension') || group.includes('Elderly')) icon = '👵';
                          else if (group.includes('Cholesterol')) icon = '🍳';
                          else if (group.includes('Weight')) icon = '⚖️';
                          
                          return (
                            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs font-semibold">
                              <span>{icon}</span>
                              {group}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* NOVA processing level */}
              {!scoringFailed && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Processing Level</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((g) => (
                        <div key={g} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                          g <= result.novaGroup
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow'
                            : 'bg-gray-100 text-gray-400'
                        }`}>{g}</div>
                      ))}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{result.novaLabel}</span>
                      <p className="text-xs text-gray-500">NOVA Group {result.novaGroup}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{result.novaDescription}</p>
                </div>
              )}

              {/* Good points */}
              {!scoringFailed && result.positives.length > 0 && (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
                  <h3 className="font-semibold text-emerald-800 mb-2">Good Points</h3>
                  <ul className="space-y-1">
                    {result.positives.map((p, i) => (
                      <li key={i} className="text-sm text-emerald-700">✓ {p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {!scoringFailed && result.warnings.length > 0 && (
                <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Health Warnings</h3>
                  <ul className="space-y-1">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-sm text-red-700">⚠ {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Healthy Alternatives & Real Product Comparison */}
              {!scoringFailed && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-2xl border border-emerald-100 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-bold text-emerald-950 text-base">Healthier Alternatives</h3>
                  </div>

                  {/* Real Database Products Comparison */}
                  {dbAlternatives.length > 0 ? (
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-emerald-800/80 uppercase tracking-wider block">
                        Real Products Compared (vs. your {result.overallScore}/100)
                      </span>
                      <div className="space-y-2.5">
                        {dbAlternatives.map((alt, idx) => {
                          const scoreDiff = alt.overallScore - result.overallScore;
                          return (
                            <div 
                              key={idx} 
                              onClick={() => onSelectProduct?.(alt.product.code)}
                              className="bg-white rounded-xl p-3 border border-emerald-100/50 shadow-sm flex items-center justify-between gap-3 hover:border-emerald-500 hover:shadow-md transition duration-200 cursor-pointer"
                              title="Click to view health score details"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                {alt.product.image_front_url ? (
                                  <img 
                                    src={alt.product.image_front_url} 
                                    alt={alt.product.product_name}
                                    className="w-10 h-10 object-contain rounded-md bg-gray-50 border border-gray-100 p-1 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                                    📦
                                  </div>
                                )}
                                <div className="truncate">
                                  <h4 className="font-bold text-gray-900 text-xs truncate leading-normal">
                                    {alt.product.product_name}
                                  </h4>
                                  <p className="text-[10px] text-gray-400 truncate leading-none">
                                    {alt.product.brands || 'Unknown Brand'}
                                  </p>
                                  <span className="inline-block mt-1 text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                                    +{Math.round(scoreDiff)} pts better
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <span className="text-xs font-black text-gray-800 block leading-tight">
                                    {Math.round(alt.overallScore)}/100
                                  </span>
                                  <span className="text-[9px] text-gray-400">Score</span>
                                </div>
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-sm"
                                  style={{ backgroundColor: alt.gradeColor }}>
                                  {alt.grade}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : loadingAlts ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-emerald-800 font-semibold">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      Searching database for healthier matches...
                    </div>
                  ) : null}

                  {/* General Clean Swaps */}
                  {result.healthyAlternatives && result.healthyAlternatives.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-emerald-100/50">
                      <span className="text-[10px] font-bold text-emerald-800/80 uppercase tracking-wider block">
                        General Clean Food Swaps
                      </span>
                      <div className="space-y-2.5">
                        {result.healthyAlternatives.map((alt, idx) => (
                          <div key={idx} className="bg-white rounded-xl p-3.5 border border-emerald-100/60 shadow-sm flex items-start gap-3">
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: alt.gradeColor }}>
                              {alt.grade}
                            </span>
                            <div className="space-y-1">
                              <h4 className="font-bold text-gray-900 text-xs leading-normal">{alt.name}</h4>
                              <p className="text-[10px] text-gray-600 leading-normal">{alt.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}



              {/* Raw nutrition — always shown as the primary data source */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Nutrition per 100g</h3>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">From Open Food Facts</span>
                </div>
                <RawNutritionPanel nutriments={nutriments} />
                {Object.values(nutriments).every((v) => v == null) && (
                  <p className="text-sm text-gray-400 text-center py-2">No nutritional data available</p>
                )}
              </div>

              {/* Ingredients */}
              {product.ingredients_text && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.ingredients_text}</p>
                </div>
              )}
            </>
          )}

          {/* ── Details tab ── */}
          {activeTab === 'details' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Nutrition per 100g</h3>
              {!scoringFailed && result.nutrientScores.length > 0 ? (
                <div className="space-y-3">
                  {result.nutrientScores.map((n, i) => (
                    <NutrientBar key={i} nutrient={n} />
                  ))}
                </div>
              ) : (
                <RawNutritionPanel nutriments={nutriments} />
              )}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Energy</span>
                  <span className="font-semibold text-gray-900">
                    {nutriments.energy_100g != null ? `${nutriments.energy_100g} kcal` : '—'} / 100g
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── About tab ── */}
          {activeTab === 'about' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">How this score works</h3>
              <div className="text-sm text-gray-600 space-y-3">
                <p>This score combines NOVA classification and Nutri-Score methodology adapted for Indian dietary context.</p>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="font-medium text-gray-900">NOVA Classification</p>
                  <p>Classifies foods by processing level (1 = unprocessed, 4 = ultra-processed).</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="font-medium text-gray-900">Nutri-Score Methodology</p>
                  <p>Scores based on nutrients to limit (sugar, salt, fat) vs. nutrients to encourage (fiber, protein).</p>
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  Product data sourced from <span className="font-medium">Open Food Facts</span> (openfoodfacts.org).
                  Always consult a nutritionist for medical advice.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Floating AI Chatbot - Visible across all tabs */}
      {!scoringFailed && (
        <FoodChat result={result} />
      )}
    </div>
  );
}
