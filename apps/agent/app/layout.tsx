import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luna 🌙 — Your Personal Event Agent',
  description: 'Your personal secretary for the night out. Powered by AllFans. Settled on Casper.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
