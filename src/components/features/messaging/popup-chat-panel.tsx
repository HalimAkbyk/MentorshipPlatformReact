'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Flag, MessageSquare, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useBookingMessages, useSendMessage, useMarkAsRead } from '@/lib/hooks/use-messages';
import { ReportDialog } from './report-dialog';
import type { ConversationDto } from '@/lib/types/models';
import { cn } from '@/lib/utils/cn';

interface PopupChatPanelProps {
  conversation: ConversationDto;
  onBack: () => void;
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

export function PopupChatPanel({ conversation, onBack }: PopupChatPanelProps) {
  const [content, setContent] = useState('');
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll (container-level only, not page)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Reset on conversation change
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
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50">
        <button onClick={onBack} className="p-1 hover:bg-gray-200 rounded-md transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarImage src={conversation.otherUserAvatar ?? undefined} />
          <AvatarFallback className="text-[10px] bg-primary-100 text-primary-600">
            {conversation.otherUserName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold truncate">{conversation.otherUserName}</h4>
          <p className="text-[10px] text-gray-500 truncate">{conversation.offeringTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 bg-gray-50/30">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-8 h-8 mb-1" />
            <p className="text-xs">Henüz mesaj yok</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-1.5 max-w-[85%] group',
              msg.isOwnMessage ? 'ml-auto flex-row-reverse' : ''
            )}
          >
            {!msg.isOwnMessage && (
              <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                <AvatarImage src={msg.senderAvatar ?? undefined} />
                <AvatarFallback className="text-[8px] bg-gray-200">
                  {msg.senderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs relative',
                msg.isOwnMessage
                  ? 'bg-lime-100 text-gray-800 rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              )}
            >
              {!msg.isOwnMessage && (
                <p className="text-[9px] font-medium text-gray-500 mb-0.5">{msg.senderName}</p>
              )}
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="text-[9px] text-gray-400">{formatTime(msg.createdAt)}</span>
                {!msg.isOwnMessage && (
                  <button
                    onClick={() => setReportMessageId(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded"
                    title="Mesajı bildir"
                  >
                    <Flag className="w-2.5 h-2.5 text-red-400 hover:text-red-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div />
      </div>

      {/* Input */}
      <div className="border-t p-2 flex gap-1.5 bg-white">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mesaj yazın..."
          maxLength={2000}
          rows={1}
          className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-lime-300 resize-none min-h-[32px] max-h-[80px]"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!content.trim() || sendMutation.isPending}
          className="self-end shrink-0 h-8 w-8 p-0"
        >
          {sendMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
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
