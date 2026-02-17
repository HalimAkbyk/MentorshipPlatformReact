'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Flag, MessageSquare, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookingMessages, useSendMessage, useMarkAsRead } from '@/lib/hooks/use-messages';
import { ReportDialog } from './report-dialog';
import { MessageStatus } from './message-status';
import { setActiveBookingId } from '@/lib/hooks/use-signalr';
import { cn } from '@/lib/utils/cn';

interface MessagePanelProps {
  bookingId: string;
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

export function MessagePanel({ bookingId }: MessagePanelProps) {
  const [content, setContent] = useState('');
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading } = useBookingMessages(bookingId);
  const sendMutation = useSendMessage();
  const markAsRead = useMarkAsRead();

  const messages = data?.items ?? [];

  // Mark as read when panel opens / new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const hasUnread = messages.some((m) => !m.isOwnMessage && !m.isRead);
      if (hasUnread) {
        markAsRead.mutate(bookingId);
      }
    }
  }, [messages.length, bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom (container-level only, not page)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Track active booking for auto-read
  useEffect(() => {
    setActiveBookingId(bookingId);
    return () => setActiveBookingId(null);
  }, [bookingId]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await sendMutation.mutateAsync({ bookingId, content: trimmed });
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
    <>
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <CardTitle className="text-base">Mesajlar</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Message List */}
          <div ref={scrollContainerRef} className="h-[400px] overflow-y-auto px-4 py-2 space-y-3 bg-gray-50/50">
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
                {/* Avatar */}
                {!msg.isOwnMessage && (
                  <Avatar className="w-7 h-7 shrink-0 mt-1">
                    <AvatarImage src={msg.senderAvatar ?? undefined} />
                    <AvatarFallback className="text-[10px] bg-gray-200">
                      {msg.senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Bubble */}
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
                    <MessageStatus isOwnMessage={msg.isOwnMessage} deliveredAt={msg.deliveredAt} readAt={msg.readAt} />
                    {/* Report button — only on other party's messages */}
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
            <div />
          </div>

          {/* Input Area */}
          <div className="border-t p-3 flex gap-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mesajınızı yazın..."
              maxLength={2000}
              rows={1}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-300 resize-none min-h-[38px] max-h-[100px]"
              style={{ height: 'auto' }}
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
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <ReportDialog
        messageId={reportMessageId ?? ''}
        isOpen={!!reportMessageId}
        onClose={() => setReportMessageId(null)}
      />
    </>
  );
}
