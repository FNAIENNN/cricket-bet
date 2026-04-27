'use client';

import { BetPlacement } from './bet-placement';
import { Suspense } from 'react';

export function ClientBetPlacement(props: any) {
  return (
    <Suspense fallback={<div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500">Loading bet form...</div>}>
      <BetPlacement {...props} />
    </Suspense>
  );
}
