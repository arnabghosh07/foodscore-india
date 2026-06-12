import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PWARegistration from '@/components/PWARegistration';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://foodscore-india.vercel.app'),
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
  openGraph: {
    title: 'FoodScore India - Scan & Rate Your Food',
    description: 'Scan barcodes of Indian packaged food products and get instant health scores. Calibrated for the Indian dietary context.',
    url: 'https://foodscore-india.vercel.app',
    siteName: 'FoodScore India',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'FoodScore India Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'FoodScore India - Scan & Rate Your Food',
    description: 'Scan barcodes of Indian packaged food products and get instant health scores.',
    images: ['/icon-512.png'],
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
        <Analytics />
      </body>
    </html>
  );
}
