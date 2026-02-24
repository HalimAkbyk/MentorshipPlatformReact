'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationList } from './conversation-list';
import { ConversationDetail } from './conversation-detail';
import { useConversations } from '@/lib/hooks/use-messages';
import { useAuthStore } from '@/lib/stores/auth-store';

export function MessagesPageLayout() {
  const searchParams = useSearchParams();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const { data: conversations } = useConversations();
  const autoSelectedRef = useRef(false);

  // Auto-select conversation from URL params (?bookingId=xxx or ?userId=xxx)
  useEffect(() => {
    if (autoSelectedRef.current || !conversations || conversations.length === 0) return;

    const bookingIdParam = searchParams.get('bookingId');
    const userIdParam = searchParams.get('userId');

    if (bookingIdParam) {
      const found = conversations.find((c) => c.bookingId === bookingIdParam);
      if (found) {
        setSelectedBookingId(bookingIdParam);
        autoSelectedRef.current = true;
      }
    } else if (userIdParam) {
      const found = conversations.find((c) => c.otherUserId === userIdParam);
      if (found) {
        setSelectedBookingId(found.bookingId);
        autoSelectedRef.current = true;
      }
    }
  }, [conversations, searchParams]);
  const user = useAuthStore((s) => s.user);
  const isMentor = user?.roles?.includes('Mentor');

  const selectedConversation = conversations?.find((c) => c.bookingId === selectedBookingId) ?? null;

  const bookingDetailHref = selectedConversation
    ? isMentor
      ? `/mentor/bookings/${selectedConversation.bookingId}`
      : `/student/bookings/${selectedConversation.bookingId}`
    : '#';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mesajlarım</h1>
          <p className="text-gray-600 mt-1">Rezervasyon bazlı mesajlaşmalarınız</p>
        </div>

        {/* Split Panel Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-220px)] flex">
          {/* Left Panel — Conversation List */}
          <div
            className={`w-full md:w-96 md:border-r border-gray-200 flex flex-col overflow-y-auto shrink-0 ${
              selectedBookingId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* List Header */}
            <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
              <h2 className="text-sm font-semibold text-gray-700">Konuşmalar</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                selectedBookingId={selectedBookingId}
                onSelect={setSelectedBookingId}
              />
            </div>
          </div>

          {/* Right Panel — Conversation Detail */}
          <div
            className={`flex-1 flex flex-col min-w-0 ${
              selectedBookingId ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Mobile Back Button */}
            {selectedBookingId && (
              <div className="md:hidden border-b px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBookingId(null)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Geri
                </Button>
              </div>
            )}

            {selectedConversation ? (
              <ConversationDetail
                conversation={selectedConversation}
                bookingDetailHref={bookingDetailHref}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-gray-500">Bir konuşma seçin</h3>
                <p className="text-sm mt-1 text-center max-w-xs">
                  Sol panelden bir konuşma seçerek mesajlaşmanıza başlayabilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
