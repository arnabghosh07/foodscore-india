'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Immediately check for a new SW version and activate it
          reg.update();
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
