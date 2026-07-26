// src/components/ui/StatCard.tsx
'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  footer?: ReactNode;
}

export const StatCard = ({ title, value, icon, footer }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">{icon}</div>
      </div>
      {footer && <div className="mt-2 text-sm text-gray-500">{footer}</div>}
    </div>
  );
};
