'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  description?: string;
}

const iconBgVariants: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'bg-primary-100 text-primary-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  description,
}: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                %{Math.abs(trend.value).toFixed(1)}
              </span>
            </div>
          )}
          {description && (
            <p className="mt-1 text-xs text-gray-400">{description}</p>
          )}
        </div>
        <div
          className={cn(
            'flex-shrink-0 rounded-xl p-3',
            iconBgVariants[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
