import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About – FoodScore India',
  description:
    'Learn about FoodScore India — how it works, the science behind the health scores, and our mission to make nutrition transparent for Indian consumers.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow shadow-emerald-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">FoodScore India</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            About
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">About FoodScore India</h1>
          <p className="text-gray-600 leading-relaxed">
            Making nutrition transparent for Indian consumers — one scan at a time.
          </p>
        </div>

        <div className="space-y-6">
          {/* What is it */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow shadow-emerald-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.243m-4.243 0L9 9m3 3l2.8 2.8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">What is FoodScore India?</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  FoodScore India is a free, open-source Progressive Web App (PWA) that lets you scan
                  the barcode of any packaged food product and instantly receive a health score
                  calibrated for the Indian dietary context. No sign-up, no ads, no subscriptions — just
                  scan and get a score.
                </p>
              </div>
            </div>
          </div>

          {/* How scores work */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </span>
              How the Score Works
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Our score is a composite of two internationally recognised systems, adapted for India:
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-1.5">NOVA Classification</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  NOVA groups foods by their degree of industrial processing — from Group 1
                  (unprocessed) to Group 4 (ultra-processed). Ultra-processed foods are strongly
                  linked to poor health outcomes. We penalise higher NOVA groups accordingly.
                </p>
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { label: 'Group 1', sub: 'Unprocessed', color: 'bg-emerald-100 text-emerald-700' },
                    { label: 'Group 2', sub: 'Culinary', color: 'bg-yellow-100 text-yellow-700' },
                    { label: 'Group 3', sub: 'Processed', color: 'bg-orange-100 text-orange-700' },
                    { label: 'Group 4', sub: 'Ultra', color: 'bg-red-100 text-red-700' },
                  ].map((g) => (
                    <div key={g.label} className={`rounded-lg p-2 ${g.color}`}>
                      <div className="text-xs font-bold">{g.label}</div>
                      <div className="text-xs">{g.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-1.5">Nutri-Score (India-adapted)</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Nutri-Score assigns a letter grade (A–E) based on nutritional composition per 100 g.
                  We adapt the thresholds for nutrients common in Indian packaged foods — including
                  added sugar, sodium, saturated fat, fibre, and protein — using ICMR-NIN Recommended
                  Dietary Allowances as reference values where available.
                </p>
              </div>
            </div>
          </div>

          {/* Data Source */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              Data Source
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              All product data is sourced from{' '}
              <a href="https://openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">
                Open Food Facts
              </a>
              , a free, open, and collaborative database of food products from around the world.
              Open Food Facts is community maintained — anyone can add or correct product data.
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-700 flex gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Because Open Food Facts is community-maintained, nutritional data may be incomplete or
                occasionally inaccurate. Always verify with the physical product label.
              </p>
            </div>
          </div>

          {/* Team */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              The Team
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              FoodScore India is a <strong className="text-gray-800">solo indie project</strong>. It
              was built out of a genuine frustration with how hard it is to quickly understand whether
              a packaged food product is actually good for you — especially given the complexity of
              Indian diets and the misleading claims on many product labels.
            </p>
          </div>

          {/* Mission */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
            <h2 className="text-lg font-semibold mb-2">Our Mission</h2>
            <p className="text-sm leading-relaxed text-emerald-50">
              India&apos;s packaged food market is growing rapidly, but consumer awareness of nutrition
              has not kept pace. Our mission is simple: give every Indian consumer a clear, instant
              answer to &quot;Is this food actually good for me?&quot; — without jargon, without subscriptions,
              and without compromising your privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
