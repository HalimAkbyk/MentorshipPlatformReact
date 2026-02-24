'use client';

import { useState } from 'react';
import { CheckCircle, Star, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface PostSessionScreenProps {
  title: string;
  otherPartyName: string;
  durationFormatted: string;
  isMentor: boolean;
  onGoBack: () => void;
  onSubmitReview?: (rating: number, comment: string) => Promise<void>;
  onSendMessage?: (message: string) => Promise<void>;
}

export function PostSessionScreen({
  title,
  otherPartyName,
  durationFormatted,
  isMentor,
  onGoBack,
  onSubmitReview,
  onSendMessage,
}: PostSessionScreenProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!onSubmitReview || rating === 0) return;
    setSubmitting(true);
    try {
      await onSubmitReview(rating, comment);
      setSubmitted(true);
    } catch {
      // Handle silently — toast shown by parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!onSendMessage || !message.trim()) return;
    setSubmitting(true);
    try {
      await onSendMessage(message);
      setMessage('');
    } catch {
      // Handle silently
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Seans Tamamlandı</h1>
          <p className="text-gray-400">{title}</p>
          <p className="text-sm text-gray-500 mt-1">
            {otherPartyName} ile • {durationFormatted}
          </p>
        </div>

        {/* Student: Rating */}
        {!isMentor && !submitted && onSubmitReview && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-medium">Dersi Değerlendirin</h3>

            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Yorumunuz (isteğe bağlı)..."
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              rows={3}
            />

            <Button
              onClick={handleSubmitReview}
              disabled={rating === 0 || submitting}
              className="w-full bg-teal-600 hover:bg-teal-500"
            >
              {submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
            </Button>
          </div>
        )}

        {/* Student: Thank you after submission */}
        {!isMentor && submitted && (
          <div className="bg-gray-800 rounded-xl p-6">
            <p className="text-green-400 font-medium">Değerlendirmeniz kaydedildi!</p>
            <p className="text-gray-400 text-sm mt-1">Geri bildiriminiz için teşekkürler.</p>
          </div>
        )}

        {/* Mentor: Quick message option */}
        {isMentor && onSendMessage && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="text-white font-medium flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Öğrenciye Mesaj Gönder
            </h3>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Ders notları veya mesaj..."
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              rows={3}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || submitting}
              variant="outline"
              className="w-full text-gray-300 border-gray-600"
            >
              {submitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
            </Button>
          </div>
        )}

        {/* Go Back Button */}
        <Button
          onClick={onGoBack}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Seanslarıma Dön
        </Button>
      </div>
    </div>
  );
}
