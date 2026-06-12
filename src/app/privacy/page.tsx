import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy – FoodScore India',
  description:
    'Learn how FoodScore India collects, uses, and protects your information. We are committed to your privacy.',
};

export default function PrivacyPage() {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Privacy First
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Effective date: 12 June 2026</p>
        </div>

        <div className="space-y-6">
          {/* Intro */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-700 leading-relaxed">
              FoodScore India (&quot;we&quot;, &quot;our&quot;, or &quot;the app&quot;) is committed to protecting your privacy.
              This policy explains what information we collect, how we use it, and what choices you have.
              <strong className="text-gray-900"> We do not collect any personal data.</strong>
            </p>
          </div>

          {/* Section 1 – Data Collected */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">1</span>
              Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-1">Scan History (Local Only)</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  When you scan or look up a food product, the barcode, product name, health score, and
                  timestamp are saved to your device&apos;s <strong>localStorage</strong>. This data never
                  leaves your device — it is never transmitted to any server controlled by us.
                  You can delete it at any time using the &quot;Clear history&quot; button in the app.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1">No Account or Personal Data</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We do not ask for your name, email address, phone number, location, or any other
                  personally identifiable information. No user accounts are required or created.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1">No Cookies Set by Us</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  FoodScore India does not set any first-party cookies. The only browser storage we
                  use is localStorage for your scan history.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2 – Third Party */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">2</span>
              Third-Party Services
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Open Food Facts API</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Product data (nutritional values, ingredients, NOVA groups) is fetched from{' '}
                    <a href="https://openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                      openfoodfacts.org
                    </a>
                    . When you scan a barcode, the barcode number is sent to the Open Food Facts API
                    to retrieve product information. Open Food Facts&apos; own{' '}
                    <a href="https://world.openfoodfacts.org/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                      privacy policy
                    </a>{' '}
                    applies to those requests.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Vercel Analytics</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We use Vercel Analytics to understand aggregate usage patterns (e.g. page views).
                    Vercel Analytics is <strong>privacy-friendly</strong>: it does not use cookies,
                    does not fingerprint individual users, and does not share data with advertisers.
                    No personal data is collected. See{' '}
                    <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                      Vercel&apos;s privacy documentation
                    </a>{' '}
                    for details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 – Children */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">3</span>
              Children&apos;s Privacy
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              FoodScore India does not knowingly collect any information from children under 13.
              Because we collect no personal data from anyone, there is no special risk to children.
            </p>
          </div>

          {/* Section 4 – Changes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">4</span>
              Changes to This Policy
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. When we do, we will update the
              &quot;Effective date&quot; at the top of this page. Continued use of the app after any changes
              constitutes your acceptance of the new policy.
            </p>
          </div>

          {/* Section 5 – Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">5</span>
              Contact
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:privacy@foodscore.in" className="text-emerald-600 hover:underline font-medium">
                privacy@foodscore.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
