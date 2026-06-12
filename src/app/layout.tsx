import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PWARegistration from '@/components/PWARegistration';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodScore India - Scan & Rate Your Food',
  description: 'Scan barcodes of Indian packaged food products and get instant health scores. Powered by Open Food Facts and NOVA classification.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FoodScore',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
