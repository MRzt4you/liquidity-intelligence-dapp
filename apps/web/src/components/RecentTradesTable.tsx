// src/components/RecentTradesTable.tsx
'use client';

import React from 'react';
import { Trade } from '@/types';

interface Props {
  trades: Trade[];
}

export default function RecentTradesTable({ trades }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 px-4 text-gray-400">Token</th>
            <th className="text-left py-2 px-4 text-gray-400">Amount</th>
            <th className="text-left py-2 px-4 text-gray-400">Price</th>
            <th className="text-left py-2 px-4 text-gray-400">Type</th>
            <th className="text-left py-2 px-4 text-gray-400">Status</th>
            <th className="text-left py-2 px-4 text-gray-400">PnL</th>
            <th className="text-left py-2 px-4 text-gray-400">Time</th>
          </tr>
        </thead>
        <tbody>
          {trades.slice(0, 10).map((trade) => (
            <tr key={trade.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
              <td className="py-3 px-4 font-semibold">{trade.token.symbol}</td>
              <td className="py-3 px-4">{trade.amount.toFixed(4)}</td>
              <td className="py-3 px-4">${trade.price.toFixed(6)}</td>
              <td className="py-3 px-4">
                <span className={trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                  {trade.type.toUpperCase()}
                </span>
              </td>
              <td className={`py-3 px-4 ${getStatusColor(trade.status)}`}>
                {trade.status}
              </td>
              <td className={`py-3 px-4 font-semibold ${trade.pnl && trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trade.pnl ? `${trade.pnl > 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : '-'}
              </td>
              <td className="py-3 px-4 text-gray-400">
                {new Date(trade.timestamp).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
