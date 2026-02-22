'use client';

import Link from 'next/link';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConversations } from '@/lib/hooks/use-messages';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import type { ConversationDto } from '@/lib/types/models';
import { cn } from '@/lib/utils/cn';

interface ConversationListCompactProps {
  isOpen: boolean;
  onSelectConversation: (conv: ConversationDto) => void;
  onClose: () => void;
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

export function ConversationListCompact({ isOpen, onSelectConversation, onClose }: ConversationListCompactProps) {
  const { data: conversations, isLoading } = useConversations(isOpen);
  const user = useAuthStore((s) => s.user);
  const isMentor = user?.roles?.includes(UserRole.Mentor as any);
  const messagesHref = isMentor ? '/mentor/messages' : '/student/messages';

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-2.5 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-gray-400">
        <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm font-medium text-gray-500">Henüz mesajınız yok</p>
        <p className="text-xs text-center mt-1">
          Rezervasyon yaptıktan sonra mesajlaşabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {conversations.map((conv) => (
          <button
            key={conv.bookingId}
            onClick={() => onSelectConversation(conv)}
            className={cn(
              'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors',
              conv.unreadCount > 0 && 'bg-blue-50/30'
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={conv.otherUserAvatar ?? undefined} />
                <AvatarFallback className="bg-primary-100 text-primary-600 text-xs">
                  {conv.otherUserName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={cn(
                    'text-sm truncate',
                    conv.unreadCount > 0 ? 'font-semibold' : 'font-medium text-gray-700'
                  )}>
                    {conv.otherUserName}
                  </h4>
                  {conv.lastMessageAt && (
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  )}
                </div>
                {conv.lastMessageContent && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className={cn(
                      'text-xs truncate flex-1',
                      conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'
                    )}>
                      {conv.lastMessageIsOwn && <span className="text-gray-400">Siz: </span>}
                      {conv.lastMessageContent}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-teal-500 text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] px-1 flex items-center justify-center shrink-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* Footer link */}
      <div className="border-t px-4 py-2.5">
        <Link
          href={messagesHref}
          onClick={onClose}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1"
        >
          Tüm Mesajları Gör
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
