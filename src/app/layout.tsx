'use client';

import { useEffect } from 'react';
import { listenForAccountChanges } from '@/lib/walletUtils';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    listenForAccountChanges((accounts) => {
      if (accounts.length === 0) {
        // Handle disconnection
        console.log('Wallet disconnected');
        // You might want to redirect to the login page here
      } else {
        // Handle account change
        console.log('Active account changed to', accounts[0]);
        // You might want to update your app state here
      }
    });
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
