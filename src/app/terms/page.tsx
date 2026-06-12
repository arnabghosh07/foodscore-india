import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service – FoodScore India',
  description:
    'Read the Terms of Service for FoodScore India. The app is for informational purposes only and is not a substitute for medical advice.',
};

export default function TermsPage() {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Legal
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500">Effective date: 12 June 2026</p>
        </div>

        <div className="space-y-6">
          {/* Acceptance */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-700 leading-relaxed">
              By accessing or using FoodScore India (the &quot;App&quot;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the App.
            </p>
          </div>

          {/* Not Medical Advice */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h2 className="text-base font-semibold text-amber-800 mb-2">Not Medical Advice</h2>
                <p className="text-sm text-amber-700 leading-relaxed">
                  FoodScore India is provided <strong>for informational purposes only</strong>. The health
                  scores, grades, and nutritional information displayed in the App are not medical advice,
                  dietary advice, or a substitute for consultation with a qualified healthcare professional.
                  Always consult a doctor or registered dietitian before making significant changes to
                  your diet, especially if you have a medical condition.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">1</span>
              Use of the App
            </h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                The App is provided free of charge and may be used for personal, non-commercial purposes.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                You may not use the App for any unlawful purpose or in violation of any applicable laws.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                You may not attempt to reverse-engineer, scrape, or abuse the App or the underlying APIs.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">2</span>
              Accuracy of Data
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Product nutritional data is sourced from Open Food Facts, a community-maintained open
              database. We make no warranty — express or implied — regarding the accuracy, completeness,
              or timeliness of any data displayed in the App. Nutritional information may be incomplete,
              outdated, or contain errors. <strong className="text-gray-800">Always verify with the physical product label.</strong>
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">3</span>
              Limitation of Liability
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              To the fullest extent permitted by applicable law, FoodScore India and its creator shall
              not be liable for any direct, indirect, incidental, special, consequential, or punitive
              damages arising out of or related to your use of, or inability to use, the App. This
              includes — but is not limited to — any health decisions made based on scores or information
              displayed in the App.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">4</span>
              Third-Party Services
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              The App relies on the Open Food Facts API, which is governed by its own terms of service.
              We are not responsible for the availability, accuracy, or content of third-party services.
            </p>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">5</span>
              Intellectual Property
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              The App&apos;s source code is open-source. Product data displayed in the App is licensed
              under the{' '}
              <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                Open Database License (ODbL)
              </a>{' '}
              by Open Food Facts contributors.
            </p>
          </div>

          {/* Section 6 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">6</span>
              Changes to These Terms
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will take
              effect immediately upon posting to the App. The &quot;Effective date&quot; at the top of this page
              will be updated accordingly. Continued use of the App after changes constitute your
              acceptance of the revised terms.
            </p>
          </div>

          {/* Section 7 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">7</span>
              Governing Law
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India.
              Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center text-xs font-bold">8</span>
              Contact
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Questions about these Terms? Reach us at{' '}
              <a href="mailto:legal@foodscore.in" className="text-emerald-600 hover:underline font-medium">
                legal@foodscore.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
