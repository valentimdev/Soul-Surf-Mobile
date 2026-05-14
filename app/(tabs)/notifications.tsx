import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationDTO } from '@/services/notifications/notificationService';
import { useFocusEffect } from 'expo-router';
import { Clock, MessageSquare, Star, Waves } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type NotificationVisualType = 'review' | 'message' | 'alert';

const ICON_MAP: Record<NotificationVisualType, { icon: React.ElementType; bg: string }> = {
  review: { icon: Star, bg: '#EDE8D6' },
  message: { icon: MessageSquare, bg: '#E0EFF5' },
  alert: { icon: Waves, bg: '#E0EFF5' },
};

function getVisualType(type: string): NotificationVisualType {
  const normalized = type.toUpperCase();

  if (normalized.includes('ALERT') || normalized.includes('WEATHER')) {
    return 'alert';
  }

  if (
    normalized.includes('COMMENT') ||
    normalized.includes('REPLY') ||
    normalized.includes('MENTION') ||
    normalized.includes('MESSAGE')
  ) {
    return 'message';
  }

  return 'review';
}

function formatNotificationTitle(type: string) {
  const normalized = type.toUpperCase();

  if (normalized === 'LIKE') return 'Novo like';
  if (normalized === 'COMMENT') return 'Novo comentario';
  if (normalized === 'REPLY') return 'Nova resposta';
  if (normalized === 'FOLLOW') return 'Novo seguidor';
  if (normalized === 'MENTION') return 'Voce foi mencionado';
  if (normalized === 'ALERT') return 'Alerta';

  return 'Notificacao';
}

function formatTimeAgo(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60 * 1000) return 'agora';

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `${diffMinutes} min atras`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h atras`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `${diffDays} dias atras`;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function NotificationCard({
  item,
  onPress,
}: {
  item: NotificationDTO;
  onPress: (item: NotificationDTO) => void;
}) {
  const visualType = getVisualType(item.type);
  const iconConfig = ICON_MAP[visualType];
  const IconComponent = iconConfig.icon;

  return (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      activeOpacity={0.8}
      onPress={() => onPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
        <IconComponent size={24} color="#5C9DB8" />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{formatNotificationTitle(item.type)}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.cardDescription}>{item.message}</Text>

        <View style={styles.timeRow}>
          <Clock size={14} color="#999" />
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const {
    notifications,
    loading,
    refreshing,
    error,
    loadNotifications,
    markAsRead,
  } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = useCallback(async (item: NotificationDTO) => {
    if (item.read) return;

    try {
      await markAsRead(item.id);
    } catch (e) {
      console.error('Erro ao marcar notificacao como lida:', e);
    }
  }, [markAsRead]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} />}
      >
        <Text style={styles.title}>Notificacoes</Text>

        {loading && notifications.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#5C9DB8" />
            <Text style={styles.centerStateText}>Carregando notificacoes...</Text>
          </View>
        ) : error && notifications.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadNotifications()}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateText}>Nenhuma notificacao no momento.</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <NotificationCard key={item.id} item={item} onPress={handleNotificationPress} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F4EB',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F4A63',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2DEC3',
    padding: 16,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  cardUnread: {
    backgroundColor: '#F0F7FA',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F4A63',
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5C9DB8',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  centerStateText: {
    color: '#5C9DB8',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#5C9DB8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
