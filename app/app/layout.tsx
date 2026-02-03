'use client';

import './globals.css';
import { Navbar } from '@/components/Navbar';
import { WalletContextProvider } from '@/components/WalletProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>AlphaStake | Stake-Verified Trading Signals</title>
        <meta name="description" content="Follow signals from providers who stake their own SOL. Skin in the game means better calls." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen">
        <WalletContextProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </WalletContextProvider>
      </body>
    </html>
  );
}
