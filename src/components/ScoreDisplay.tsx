'use client';

import { FoodScoreResult, NutrientScore } from '@/lib/types';
import { useState } from 'react';

interface ScoreDisplayProps {
  result: FoodScoreResult;
  onBack: () => void;
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
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-sm font-medium text-gray-700">{nutrient.name}</div>
      <div className="flex-1">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: (nutrient.score / nutrient.maxScore) * 100 + "%", backgroundColor: nutrient.color }} />
        </div>
      </div>
      <div className="w-16 text-right">
        <span className="text-sm font-semibold" style={{ color: nutrient.color }}>
          {nutrient.value}{nutrient.unit}
        </span>
        <span className="text-xs text-gray-400 ml-1">({nutrient.label})</span>
      </div>
    </div>
  );
}
export default function ScoreDisplay({ result, onBack }: ScoreDisplayProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "about">("overview");
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
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
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {result.product.image_front_url && (
            <img src={result.product.image_front_url} alt={result.product.product_name}
              className="w-full h-48 object-contain bg-gray-50 p-4" />
          )}
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-900">{result.product.product_name}</h2>
            {result.product.brands && <p className="text-sm text-gray-500 mt-1">{result.product.brands}</p>}
          </div>
        </div>
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <ScoreCircle score={result.overallScore} color={result.gradeColor} />
          <div className="mt-4 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: result.gradeColor }}>
              {result.grade} - {result.gradeLabel}
            </span>
          </div>
          <p className="mt-4 text-center text-gray-600 text-sm leading-relaxed">{result.summary}</p>
        </div>
        <div className="mt-6 flex bg-gray-100 rounded-xl p-1">
          {("overview details about".split(" ")).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {activeTab === "overview" && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Processing Level</h3>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((g) => (
                      <div key={g} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                        g <= result.novaGroup ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow" : "bg-gray-100 text-gray-400"
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
              {result.positives.length > 0 && (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
                  <h3 className="font-semibold text-emerald-800 mb-2">Good Points</h3>
                  <ul className="space-y-1">
                    {result.positives.map((p, i) => (
                      <li key={i} className="text-sm text-emerald-700">- {p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.warnings.length > 0 && (
                <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Health Warnings</h3>
                  <ul className="space-y-1">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-sm text-red-700">! {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {activeTab === "details" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Nutrition per 100g</h3>
              <div className="space-y-3">
                {result.nutrientScores.map((n, i) => (
                  <NutrientBar key={i} nutrient={n} />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Energy</span>
                  <span className="font-semibold text-gray-900">
                    {result.product.nutriments.energy_100g ?? "-"} kcal
                  </span>
                </div>
              </div>
            </div>
          )}
          {activeTab === "about" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">How this score works</h3>
              <div className="text-sm text-gray-600 space-y-3">
                <p>This score combines NOVA classification and Nutri-Score methodology adapted for Indian dietary context.</p>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="font-medium text-gray-900">NOVA Classification</p>
                  <p>Classifies foods by processing level.</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="font-medium text-gray-900">Nutri-Score Methodology</p>
                  <p>Scores based on nutrients to limit vs. nutrients to encourage.</p>
                </div>
                <p className="text-xs text-gray-400 mt-4">Data sourced from Open Food Facts. Always consult a nutritionist.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
