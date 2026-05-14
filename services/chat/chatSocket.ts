import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/services/api';
import type { ChatMessageResponse } from './chatService';

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

  const client = new Client({
    webSocketFactory: () => new WebSocket(buildChatSocketUrl(token)),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    onConnect: () => {
      subscription = client.subscribe(`/topic/conversations/${conversationId}`, (frame: IMessage) => {
        try {
          handlers.onMessage(JSON.parse(frame.body) as ChatMessageResponse);
        } catch (error) {
          handlers.onError?.(error);
        }
      });

      handlers.onConnect?.();
    },
    onStompError: (frame) => handlers.onError?.(frame),
    onWebSocketError: (event) => handlers.onError?.(event),
    onWebSocketClose: () => {
      subscription = null;
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
