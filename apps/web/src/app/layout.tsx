// src/app/layout.tsx
import type { Metadata } from 'next';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liquidity Hunter - DEX Monitor',
  description: 'Real-time liquidity hunting and monitoring dashboard',
  icons: {
    icon: '🎯',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <Header />
        {children}
      </body>
    </html>
  );
}
