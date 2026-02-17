'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUnreadCount } from '@/lib/hooks/use-messages';
import { ConversationListCompact } from './conversation-list-compact';
import { PopupChatPanel } from './popup-chat-panel';
import type { ConversationDto } from '@/lib/types/models';
import { cn } from '@/lib/utils/cn';

type WidgetView = 'closed' | 'list' | 'chat';

export function FloatingChatWidget() {
  const [view, setView] = useState<WidgetView>('closed');
  const [activeConversation, setActiveConversation] = useState<ConversationDto | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: unreadData } = useUnreadCount();
  const totalUnread = unreadData?.totalUnread ?? 0;

  // Hide on classroom, messages, admin, and auth pages
  const hiddenPaths = ['/classroom/', '/messages', '/admin', '/auth'];
  const shouldHide = !isAuthenticated || hiddenPaths.some((p) => pathname?.includes(p));

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setView('closed');
        setActiveConversation(null);
      }
    };
    if (view !== 'closed') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [view]);

  // Close on route change
  useEffect(() => {
    setView('closed');
    setActiveConversation(null);
  }, [pathname]);

  if (shouldHide) return null;

  const handleToggle = () => {
    if (view === 'closed') {
      setView('list');
    } else {
      setView('closed');
      setActiveConversation(null);
    }
  };

  const handleSelectConversation = (conv: ConversationDto) => {
    setActiveConversation(conv);
    setView('chat');
  };

  const handleBackToList = () => {
    setActiveConversation(null);
    setView('list');
  };

  const handleClose = () => {
    setView('closed');
    setActiveConversation(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={popupRef}>
      {/* Popup Panel */}
      {view !== 'closed' && (
        <div
          className={cn(
            'absolute bottom-16 right-0 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden',
            'animate-in fade-in-0 slide-in-from-bottom-4 duration-200'
          )}
        >
          {/* Popup Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-navy-700 text-white">
            <h3 className="font-semibold text-sm">Mesajlarım</h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-navy-600 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {view === 'list' && (
              <ConversationListCompact
                isOpen={true}
                onSelectConversation={handleSelectConversation}
                onClose={handleClose}
              />
            )}

            {view === 'chat' && activeConversation && (
              <PopupChatPanel
                conversation={activeConversation}
                onBack={handleBackToList}
              />
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 relative',
          view !== 'closed'
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-navy-700 hover:bg-navy-800'
        )}
        aria-label={view !== 'closed' ? 'Mesajları kapat' : 'Mesajlar'}
      >
        {view !== 'closed' ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}

        {/* Unread Badge */}
        {totalUnread > 0 && view === 'closed' && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-pulse">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
