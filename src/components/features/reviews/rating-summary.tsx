'use client';

import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { cn } from "../../../lib/utils/cn";

interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export function RatingSummary({ 
  averageRating, 
  totalReviews, 
  ratingDistribution 
}: RatingSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Değerlendirme Özeti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-6 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex justify-center my-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-5 h-5',
                    i < Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">{totalReviews} değerlendirme</p>
          </div>

          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star as keyof typeof ratingDistribution] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={star} className="flex items-center space-x-2">
                  <span className="text-sm w-6">{star}</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}