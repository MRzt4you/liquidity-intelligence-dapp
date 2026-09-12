// src/components/HunterGrid.tsx
'use client';

import React from 'react';
import { Hunter } from '@/types';
import HunterCard from './HunterCard';

interface Props {
  hunters: Hunter[];
}

export default function HunterGrid({ hunters }: Props) {
  if (hunters.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
        <p className="text-gray-400">No active hunters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hunters.map((hunter) => (
        <HunterCard key={hunter.id} hunter={hunter} />
      ))}
    </div>
  );
}
