import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/services/api';
import type { ChatMessageResponse } from './chatService';

const IS_DEV = typeof __DEV__ !== 'undefined'
  ? __DEV__
  : process.env.NODE_ENV !== 'production';

type ChatSocketHandlers = {
  onMessage: (message: ChatMessageResponse) => void;
  onError?: (error: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

function resolveWsBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_WS_URL?.trim();
  if (configuredUrl) {
    return configuredUrl
      .replace(/^https:\/\//i, 'wss://')
      .replace(/^http:\/\//i, 'ws://')
      .replace(/\/+$/, '');
  }

  return API_BASE_URL
    .replace(/^https:\/\//i, 'wss://')
    .replace(/^http:\/\//i, 'ws://')
    .replace(/\/+$/, '');
}

function buildChatSocketUrl(token: string): string {
  const baseUrl = resolveWsBaseUrl();
  const endpointUrl = baseUrl.endsWith('/ws') ? baseUrl : `${baseUrl}/ws`;
  return `${endpointUrl}?access_token=${encodeURIComponent(token)}`;
}

export async function connectChatSocket(
  conversationId: string,
  handlers: ChatSocketHandlers
): Promise<Client | null> {
  const token = await SecureStore.getItemAsync('userToken');

  if (!token || !conversationId) {
    return null;
  }

  let subscription: StompSubscription | null = null;
  const socketUrl = buildChatSocketUrl(token);

  const client = new Client({
    webSocketFactory: () => new WebSocket(socketUrl),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: IS_DEV ? (message) => console.log('[CHAT_WS]', message) : () => undefined,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
      authorization: `Bearer ${token}`,
    },
    onConnect: () => {
      subscription = client.subscribe(`/topic/conversations/${conversationId}`, (frame: IMessage) => {
        try {
          handlers.onMessage(JSON.parse(frame.body) as ChatMessageResponse);
        } catch (error) {
          handlers.onError?.(error);
        }
      });

      if (IS_DEV) {
        console.log('[CHAT_WS] connected', {
          conversationId,
          socketUrl: socketUrl.replace(/access_token=[^&]+/, 'access_token=***'),
        });
      }
      handlers.onConnect?.();
    },
    onDisconnect: () => {
      handlers.onDisconnect?.();
    },
    onStompError: (frame) => {
      if (IS_DEV) {
        console.error('[CHAT_WS] stomp error', {
          message: frame.headers.message,
          body: frame.body,
        });
      }
      handlers.onError?.(frame);
    },
    onWebSocketError: (event) => {
      if (IS_DEV) console.error('[CHAT_WS] websocket error', event);
      handlers.onError?.(event);
    },
    onWebSocketClose: (event) => {
      subscription = null;
      if (IS_DEV) {
        console.log('[CHAT_WS] websocket closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
      }
      handlers.onDisconnect?.();
    },
  });

  const originalDeactivate = client.deactivate.bind(client);
  client.deactivate = async (...args) => {
    subscription?.unsubscribe();
    subscription = null;
    return originalDeactivate(...args);
  };

  client.activate();
  return client;
}
