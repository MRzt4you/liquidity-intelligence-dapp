// src/components/WalletBalance.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePhantom } from '@/hooks/usePhantom';

export default function WalletBalance() {
  const { isConnected, walletAddress } = usePhantom();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchBalance();
    }
  }, [isConnected, walletAddress]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual balance fetching from Solana RPC
      // For now, showing placeholder
      setBalance(0);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected || !walletAddress) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-gray-400 text-sm mb-2">Wallet Balance</p>
      <div className="flex items-center justify-between">
        <div>
          {loading ? (
            <p className="text-2xl font-bold text-gray-400">Loading...</p>
          ) : (
            <>
              <p className="text-2xl font-bold text-white">{balance?.toFixed(4) || '0'} SOL</p>
              <p className="text-gray-400 text-xs mt-1 font-mono">{walletAddress}</p>
            </>
          )}
        </div>
        <button
          onClick={fetchBalance}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition"
          disabled={loading}
        >
          🔄
        </button>
      </div>
    </div>
  );
}
