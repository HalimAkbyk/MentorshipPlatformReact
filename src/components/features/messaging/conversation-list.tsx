'use client';

import { MessageSquare, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConversations } from '@/lib/hooks/use-messages';
import type { ConversationDto } from '@/lib/types/models';
import { cn } from '@/lib/utils/cn';

interface ConversationListProps {
  selectedBookingId: string | null;
  onSelect: (bookingId: string) => void;
}

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const d = new Date(dateString);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Şimdi';
  if (diffMin < 60) return `${diffMin}dk`;
  if (diffHour < 24) return `${diffHour}sa`;
  if (diffDay < 7) return `${diffDay}g`;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: ConversationDto;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 border-l-2',
        isActive
          ? 'bg-lime-50 border-l-lime-500'
          : 'border-l-transparent',
        conversation.unreadCount > 0 && !isActive && 'bg-blue-50/30'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 shrink-0 mt-0.5">
          <AvatarImage src={conversation.otherUserAvatar ?? undefined} />
          <AvatarFallback className="bg-primary-100 text-primary-600 text-sm">
            {conversation.otherUserName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              'text-sm truncate',
              conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            )}>
              {conversation.otherUserName}
            </h4>
            {conversation.lastMessageAt && (
              <span className="text-[10px] text-gray-400 shrink-0">
                {formatRelativeTime(conversation.lastMessageAt)}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 truncate mt-0.5">
            {conversation.offeringTitle}
          </p>

          {conversation.lastMessageContent && (
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className={cn(
                'text-xs truncate',
                conversation.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'
              )}>
                {conversation.lastMessageIsOwn && (
                  <span className="text-gray-400">Siz: </span>
                )}
                {conversation.lastMessageContent}
              </p>
              {conversation.unreadCount > 0 && (
                <span className="bg-lime-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function ConversationList({ selectedBookingId, onSelect }: ConversationListProps) {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-2.5 bg-gray-200 rounded w-1/2" />
              <div className="h-2.5 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6">
        <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium text-gray-500">Henüz mesajınız yok</p>
        <p className="text-xs text-center mt-1">
          Bir rezervasyon yaptıktan sonra mentorunuzle mesajlaşabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.bookingId}
          conversation={conv}
          isActive={selectedBookingId === conv.bookingId}
          onClick={() => onSelect(conv.bookingId)}
        />
      ))}
    </div>
  );
}
