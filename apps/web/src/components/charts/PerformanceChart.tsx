// src/components/charts/PerformanceChart.tsx
'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardData } from '@/types';

interface Props {
  data: DashboardData;
}

export default function PerformanceChart({ data }: Props) {
  // Mock chart data - replace with real data from API
  const chartData = [
    { time: '00:00', value: 10000, volume: 5000 },
    { time: '06:00', value: 12000, volume: 6000 },
    { time: '12:00', value: 11500, volume: 5500 },
    { time: '18:00', value: 14000, volume: 7000 },
    { time: '23:59', value: 15000, volume: 8000 },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-bold mb-4">Performance 24h</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="time" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6' }}
            name="Portfolio Value"
          />
          <Line 
            type="monotone" 
            dataKey="volume" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981' }}
            name="Volume"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
