import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import {
  type NotificationDTO,
  notificationService,
} from '@/services/notifications/notificationService';
import { notificationRealtimeService } from '@/services/notifications/notificationRealtimeService';
import { userService } from '@/services/users/userService';

type NotificationContextValue = {
  notifications: NotificationDTO[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isRealtimeConnected: boolean;
  loadNotifications: (isRefresh?: boolean) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const IS_DEV = typeof __DEV__ !== 'undefined'
  ? __DEV__
  : process.env.NODE_ENV !== 'production';

function sortNotifications(notifications: NotificationDTO[]) {
  return [...notifications].sort((a, b) => {
    const bTime = new Date(b.createdAt).getTime();
    const aTime = new Date(a.createdAt).getTime();
    return bTime - aTime;
  });
}

function mergeNotification(
  current: NotificationDTO[],
  incoming: NotificationDTO
) {
  const exists = current.some((notification) => notification.id === incoming.id);
  if (exists) {
    return current.map((notification) =>
      notification.id === incoming.id ? incoming : notification
    );
  }

  return sortNotifications([incoming, ...current]);
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const seenRealtimeIdsRef = useRef<Set<number>>(new Set());

  const refreshUnreadCount = useCallback(async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      if (IS_DEV) {
        console.error('Erro ao carregar badge de notificacoes:', err);
      }
    }
  }, []);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const data = sortNotifications(await notificationService.getUserNotifications());
      setNotifications(data);
      setUnreadCount(data.filter((notification) => !notification.read).length);
      seenRealtimeIdsRef.current = new Set(data.map((notification) => notification.id));
    } catch (err) {
      console.error('Erro ao carregar notificacoes:', err);
      setError('Nao foi possivel carregar as notificacoes.');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const handleRealtimeNotification = useCallback((notification: NotificationDTO) => {
    setNotifications((current) => mergeNotification(current, notification));

    if (!notification.read && !seenRealtimeIdsRef.current.has(notification.id)) {
      seenRealtimeIdsRef.current.add(notification.id);
      setUnreadCount((current) => current + 1);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: number) => {
    await notificationService.markAsRead(notificationId);

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );

    setUnreadCount((current) => Math.max(0, current - 1));
  }, []);

  useEffect(() => {
    let disconnectRealtime: (() => void) | undefined;
    let cancelled = false;

    const startRealtime = async () => {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token || cancelled) {
        return;
      }

      try {
        const currentUser = await userService.getMyProfile();
        if (cancelled || !currentUser.username) {
          return;
        }

        disconnectRealtime = notificationRealtimeService.connect({
          token,
          username: currentUser.username,
          onNotification: handleRealtimeNotification,
          onConnectionChange: (connected) => {
            if (!cancelled) {
              setIsRealtimeConnected(connected);
            }
          },
          onError: (err) => {
            if (IS_DEV) {
              console.warn('Erro no WebSocket de notificacoes:', err);
            }
          },
        });
      } catch (err) {
        if (IS_DEV) {
          console.warn('Nao foi possivel iniciar notificacoes em tempo real:', err);
        }
      }
    };

    void refreshUnreadCount();
    void startRealtime();

    const intervalId = setInterval(refreshUnreadCount, 30000);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshUnreadCount();
      }
    });

    return () => {
      cancelled = true;
      disconnectRealtime?.();
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [handleRealtimeNotification, refreshUnreadCount]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      refreshing,
      error,
      isRealtimeConnected,
      loadNotifications,
      refreshUnreadCount,
      markAsRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      refreshing,
      error,
      isRealtimeConnected,
      loadNotifications,
      refreshUnreadCount,
      markAsRead,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
}
