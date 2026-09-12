// src/components/TopTokensTable.tsx
'use client';

import React from 'react';
import { TokenPrice } from '@/types';

interface Props {
  tokens: TokenPrice[];
}

export default function TopTokensTable({ tokens }: Props) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-bold mb-4">Top Tokens</h3>
      <div className="space-y-3">
        {tokens.slice(0, 5).map((token, index) => (
          <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-700 last:border-0">
            <div className="flex items-center gap-2">
              {token.token.image && (
                <img src={token.token.image} alt={token.token.symbol} className="w-6 h-6 rounded-full" />
              )}
              <div>
                <p className="font-semibold text-sm">{token.token.symbol}</p>
                <p className="text-xs text-gray-400">${token.price.toFixed(6)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${token.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400">
                Vol: ${(token.volume24h / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
