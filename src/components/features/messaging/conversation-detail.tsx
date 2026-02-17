'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Flag, MessageSquare, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useBookingMessages, useSendMessage, useMarkAsRead } from '@/lib/hooks/use-messages';
import { ReportDialog } from './report-dialog';
import { BookingInfoHeader } from './booking-info-header';
import type { ConversationDto } from '@/lib/types/models';
import { cn } from '@/lib/utils/cn';

interface ConversationDetailProps {
  conversation: ConversationDto;
  bookingDetailHref: string;
}

function formatTime(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ConversationDetail({ conversation, bookingDetailHref }: ConversationDetailProps) {
  const [content, setContent] = useState('');
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading } = useBookingMessages(conversation.bookingId);
  const sendMutation = useSendMessage();
  const markAsRead = useMarkAsRead();

  const messages = data?.items ?? [];

  // Mark as read
  useEffect(() => {
    if (messages.length > 0) {
      const hasUnread = messages.some((m) => !m.isOwnMessage && !m.isRead);
      if (hasUnread) {
        markAsRead.mutate(conversation.bookingId);
      }
    }
  }, [messages.length, conversation.bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Reset input when switching conversations
  useEffect(() => {
    setContent('');
  }, [conversation.bookingId]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await sendMutation.mutateAsync({ bookingId: conversation.bookingId, content: trimmed });
      setContent('');
      textareaRef.current?.focus();
    } catch {
      // handled by mutation
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Booking Info Header */}
      <BookingInfoHeader conversation={conversation} bookingDetailHref={bookingDetailHref} />

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/30">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-10 h-10 mb-2" />
            <p className="text-sm">Henüz mesaj yok. İlk mesajı gönderin!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2 max-w-[85%] group',
              msg.isOwnMessage ? 'ml-auto flex-row-reverse' : ''
            )}
          >
            {!msg.isOwnMessage && (
              <Avatar className="w-7 h-7 shrink-0 mt-1">
                <AvatarImage src={msg.senderAvatar ?? undefined} />
                <AvatarFallback className="text-[10px] bg-gray-200">
                  {msg.senderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                'rounded-2xl px-3.5 py-2 text-sm relative',
                msg.isOwnMessage
                  ? 'bg-lime-100 text-gray-800 rounded-tr-md'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md'
              )}
            >
              {!msg.isOwnMessage && (
                <p className="text-[10px] font-medium text-gray-500 mb-0.5">
                  {msg.senderName}
                </p>
              )}
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                {!msg.isOwnMessage && (
                  <button
                    onClick={() => setReportMessageId(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded"
                    title="Mesajı bildir"
                  >
                    <Flag className="w-3 h-3 text-red-400 hover:text-red-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-3 flex gap-2 bg-white">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mesajınızı yazın..."
          maxLength={2000}
          rows={1}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-300 resize-none min-h-[38px] max-h-[100px]"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!content.trim() || sendMutation.isPending}
          className="self-end shrink-0"
        >
          {sendMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Report Dialog */}
      <ReportDialog
        messageId={reportMessageId ?? ''}
        isOpen={!!reportMessageId}
        onClose={() => setReportMessageId(null)}
      />
    </div>
  );
}
