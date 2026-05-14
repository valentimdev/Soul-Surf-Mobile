import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

import api from '../api';
import type { NotificationDTO } from './notificationService';

type NotificationHandler = (notification: NotificationDTO) => void;
type ConnectionHandler = (connected: boolean) => void;

type ConnectOptions = {
  token: string;
  username: string;
  onNotification?: NotificationHandler;
  onConnectionChange?: ConnectionHandler;
  onError?: (error: unknown) => void;
};

const IS_DEV = typeof __DEV__ !== 'undefined'
  ? __DEV__
  : process.env.NODE_ENV !== 'production';

let activeClient: Client | null = null;
let activeSubscription: StompSubscription | null = null;

function resolveWebSocketUrl(): string {
  const baseURL = String(api.defaults.baseURL ?? '').replace(/\/+$/, '');
  const appBaseURL = baseURL.replace(/\/api$/i, '');

  if (appBaseURL.startsWith('https://')) {
    return `${appBaseURL.replace(/^https:\/\//i, 'wss://')}/ws`;
  }

  if (appBaseURL.startsWith('http://')) {
    return `${appBaseURL.replace(/^http:\/\//i, 'ws://')}/ws`;
  }

  throw new Error('API baseURL invalida para WebSocket');
}

function disconnectActiveClient() {
  activeSubscription?.unsubscribe();
  activeSubscription = null;

  if (activeClient) {
    void activeClient.deactivate();
  }

  activeClient = null;
}

export const notificationRealtimeService = {
  connect({
    token,
    username,
    onNotification,
    onConnectionChange,
    onError,
  }: ConnectOptions) {
    const trimmedUsername = username.trim();
    const trimmedToken = token.trim();

    if (!trimmedToken || !trimmedUsername) {
      return () => undefined;
    }

    disconnectActiveClient();

    const wsUrl = resolveWebSocketUrl();
    const client = new Client({
      webSocketFactory: () => new WebSocket(wsUrl) as any,
      connectHeaders: {
        Authorization: `Bearer ${trimmedToken}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: IS_DEV ? (message) => console.log('[NOTIFICATION_WS]', message) : () => undefined,
      onConnect: () => {
        onConnectionChange?.(true);

        activeSubscription = client.subscribe(`/topic/notifications/${trimmedUsername}`, (message: IMessage) => {
          try {
            const notification = JSON.parse(message.body) as NotificationDTO;
            onNotification?.(notification);
          } catch (error) {
            onError?.(error);
          }
        });
      },
      onDisconnect: () => {
        onConnectionChange?.(false);
      },
      onWebSocketClose: () => {
        onConnectionChange?.(false);
      },
      onWebSocketError: (error) => {
        onConnectionChange?.(false);
        onError?.(error);
      },
      onStompError: (frame) => {
        onConnectionChange?.(false);
        onError?.(frame);
      },
    });

    activeClient = client;
    client.activate();

    return () => {
      if (activeClient === client) {
        disconnectActiveClient();
        onConnectionChange?.(false);
      }
    };
  },

  disconnect() {
    disconnectActiveClient();
  },
};
