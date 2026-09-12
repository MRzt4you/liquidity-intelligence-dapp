// src/components/HunterCard.tsx
'use client';

import React from 'react';
import { Hunter } from '@/types';

interface Props {
  hunter: Hunter;
}

export default function HunterCard({ hunter }: Props) {
  const strategyColors: Record<string, string> = {
    pump: 'bg-pink-500',
    flap: 'bg-blue-500',
    dex: 'bg-green-500',
    gecko: 'bg-purple-500',
  };

  const statusColors: Record<string, string> = {
    active: 'text-green-400',
    paused: 'text-yellow-400',
    stopped: 'text-red-400',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">{hunter.name}</h3>
          <p className="text-gray-400 text-sm mt-1">{hunter.description}</p>
        </div>
        <span className={`px-3 py-1 rounded text-sm font-semibold text-white ${strategyColors[hunter.strategy]}`}>
          {hunter.strategy.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Status</span>
          <span className={statusColors[hunter.status]}>{hunter.status}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">ROI</span>
          <span className={hunter.performance.roi > 0 ? 'text-green-400' : 'text-red-400'}>
            {hunter.performance.roi > 0 ? '+' : ''}{hunter.performance.roi.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Win Rate</span>
          <span>{(hunter.performance.winRate * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Trades</span>
          <span>{hunter.performance.trades}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-semibold transition">
          View
        </button>
        <button className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm font-semibold transition">
          Edit
        </button>
      </div>
    </div>
  );
}
