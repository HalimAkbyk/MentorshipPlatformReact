'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { apiClient } from '../../../lib/api/client';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils/cn';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

type ReviewForm = z.infer<typeof reviewSchema>;

interface ReviewModalProps {
  bookingId: string;
  mentorName: string;
  onClose: () => void;
  onSubmit: () => void;
}

export function ReviewModal({ bookingId, mentorName, onClose, onSubmit }: ReviewModalProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
    },
  });

  const rating = watch('rating');

  const submitReview = async (data: ReviewForm) => {
    try {
      setIsSubmitting(true);
      await apiClient.post('/reviews', {
        bookingId,
        rating: data.rating,
        comment: data.comment,
      });
      toast.success('Değerlendirmeniz kaydedildi!');
      onSubmit();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Dersi Değerlendir</CardTitle>
          <CardDescription>
            {mentorName} ile yaptığınız ders hakkında ne düşünüyorsunuz?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submitReview)} className="space-y-6">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Puanınız
              </label>
              <div className="flex space-x-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setValue('rating', star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={cn(
                        'w-12 h-12 transition-colors',
                        (hoveredRating >= star || rating >= star)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      )}
                    />
                  </button>
                ))}
              </div>
              {errors.rating && (
                <p className="text-sm text-red-600 text-center mt-2">
                  Lütfen bir puan seçin
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium mb-2">
                Yorumunuz (Opsiyonel)
              </label>
              <textarea
                id="comment"
                rows={4}
                placeholder="Deneyiminizi paylaşın..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                {...register('comment')}
              />
              {errors.comment && (
                <p className="text-sm text-red-600 mt-1">{errors.comment.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}