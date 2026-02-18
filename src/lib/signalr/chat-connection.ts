import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072/api';
const HUB_URL = API_URL.replace('/api', '') + '/hubs/chat';

let connection: HubConnection | null = null;

export function getConnection(): HubConnection | null {
  return connection;
}

export async function startConnection(): Promise<void> {
  if (connection?.state === HubConnectionState.Connected) return;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) return;

  connection = new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => localStorage.getItem('accessToken') || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  try {
    await connection.start();
    console.log('[SignalR] Connected');
  } catch (err) {
    console.error('[SignalR] Connection failed:', err);
    connection = null;
  }
}

export async function stopConnection(): Promise<void> {
  if (connection) {
    try {
      await connection.stop();
      console.log('[SignalR] Disconnected');
    } catch {
      // ignore
    }
    connection = null;
  }
}

export type NewMessagePayload = {
  id: string;
  bookingId: string;
  senderUserId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  isRead: boolean;
  isOwnMessage: boolean;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
};

export type MessagesReadPayload = {
  bookingId: string;
  messageIds: string[];
};

export type MessageDeliveredPayload = {
  messageId: string;
};

export function onReceiveMessage(callback: (msg: NewMessagePayload) => void): void {
  connection?.on('ReceiveMessage', callback);
}

export function onMessagesRead(callback: (payload: MessagesReadPayload) => void): void {
  connection?.on('MessagesRead', callback);
}

export function onMessageDelivered(callback: (payload: MessageDeliveredPayload) => void): void {
  connection?.on('MessageDelivered', callback);
}

export type NotificationCountPayload = {
  unreadCount: number;
};

export function onNotificationCountUpdated(callback: (payload: NotificationCountPayload) => void): void {
  connection?.on('NotificationCountUpdated', callback);
}

export function removeAllListeners(): void {
  connection?.off('ReceiveMessage');
  connection?.off('MessagesRead');
  connection?.off('MessageDelivered');
  connection?.off('NotificationCountUpdated');
}
