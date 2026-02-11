'use client';

import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Card, CardContent } from '../../../components/ui/card';
import { formatRelativeTime } from '../../../lib/utils/format';
import { cn } from "../../../lib/utils/cn";

interface Review {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface ReviewListProps {
  reviews: Review[];
  isLoading?: boolean;
}

export function ReviewList({ reviews, isLoading }: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Henüz değerlendirme yok</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={review.authorAvatar} />
                <AvatarFallback>
                  {review.authorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{review.authorName}</p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-gray-700 text-sm">{review.comment}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
