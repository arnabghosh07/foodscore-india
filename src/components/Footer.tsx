import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-8 pb-8">
      <div className="max-w-lg mx-auto px-4">
        <div className="border-t border-gray-100 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
            <Link
              href="/about"
              className="hover:text-emerald-600 transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="hover:text-emerald-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-emerald-600 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-center text-xs text-gray-300 mt-3">
            © {new Date().getFullYear()} FoodScore India
          </p>
        </div>
      </div>
    </footer>
  );
}
