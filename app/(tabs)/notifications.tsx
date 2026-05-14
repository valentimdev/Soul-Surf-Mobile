import { NotificationDTO, notificationService } from '@/services/notifications/notificationService';
import { postService } from '@/services/posts/postService';
import { useFocusEffect } from 'expo-router';
import { Clock, MessageSquare, Star, Waves } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

type NotificationVisualType = 'review' | 'message' | 'alert';

const FALLBACK_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

const ICON_MAP: Record<NotificationVisualType, { icon: React.ElementType; bg: string }> = {
  review: { icon: Star, bg: '#EDE8D6' },
  message: { icon: MessageSquare, bg: '#E0EFF5' },
  alert: { icon: Waves, bg: '#E0EFF5' },
};

function getVisualType(type: string): NotificationVisualType {
  const normalized = type.toUpperCase();
  if (normalized.includes('ALERT') || normalized.includes('WEATHER')) return 'alert';
  if (normalized.includes('COMMENT') || normalized.includes('REPLY') || normalized.includes('MENTION') || normalized.includes('MESSAGE')) return 'message';
  return 'review';
}

function formatNotificationTitle(type: string) {
  const normalized = type.toUpperCase();
  if (normalized === 'LIKE') return 'Novo like';
  if (normalized === 'COMMENT') return 'Novo comentário';
  if (normalized === 'REPLY') return 'Nova resposta';
  if (normalized === 'FOLLOW') return 'Novo seguidor';
  if (normalized === 'MENTION') return 'Você foi mencionado';
  if (normalized === 'ALERT') return 'Alerta';
  return 'Notificação';
}

function formatNotificationAction(item: NotificationDTO) {
  const type = item.type?.toUpperCase() || '';
  if (type === 'LIKE') return 'curtiu seu registro';
  if (type === 'COMMENT') return 'comentou no seu registro';
  if (type === 'REPLY') return 'respondeu ao seu comentário';
  if (type === 'FOLLOW') return 'começou a seguir você';
  if (type === 'MENTION') return 'mencionou você';

  if (item.sender && item.sender.username && item.message.startsWith(item.sender.username)) {
    return item.message.replace(item.sender.username, '').trim();
  }
  return item.message;
}

function formatTimeAgo(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60 * 1000) return 'agora';

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `${diffMinutes} min atrás`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h atrás`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function NotificationCard({
  item,
  onPress,
}: {
  item: NotificationDTO;
  onPress: (item: NotificationDTO) => void;
}) {
  const [postImage, setPostImage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    if (item.postId) {
      postService.getPostById(item.postId)
        .then(post => {
          if (isActive && post?.caminhoFoto) {
            setPostImage(post.caminhoFoto);
          }
        })
        .catch(() => {});
    }
    return () => { isActive = false; };
  }, [item.postId]);

  if (item.sender) {
    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        activeOpacity={0.8}
        onPress={() => onPress(item)}
      >
        <Image source={{ uri: item.sender.fotoPerfil || FALLBACK_AVATAR }} style={styles.senderAvatar} />

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.senderName}>{item.sender.username}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.cardAction}>{formatNotificationAction(item)}</Text>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
            {!item.read && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <TouchableOpacity onPress={() => onPress(item)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.markReadMiniText}>Marcar lida</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {item.postId && (
          <View style={styles.rightActions}>
            <View style={styles.postPreviewContainer}>
              {postImage ? (
                <Image source={{ uri: postImage }} style={styles.postPreviewImage} />
              ) : (
                <View style={styles.postPreviewFallback}>
                  <Star size={14} color="#999" />
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }

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
          <Clock size={12} color="#999" style={{marginRight: 4}} />
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>

          {!item.read && (
            <>
              <Text style={styles.dotSeparator}>•</Text>
              <TouchableOpacity onPress={() => onPress(item)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.markReadMiniText}>Marcar lida</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      setError(null);
      const data = await notificationService.getUserNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Erro ao carregar notificacoes:', e);
      setError('Não foi possível carregar as notificações.');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = useCallback(async (item: NotificationDTO) => {
    if (item.read) return;

    try {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === item.id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (e) {
      console.error('Erro ao marcar notificacao como lida:', e);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} />}
      >
        <Text style={styles.title}>Notificações</Text>

        {loading && notifications.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#5C9DB8" />
            <Text style={styles.centerStateText}>Carregando notificações...</Text>
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
            <Text style={styles.centerStateText}>Nenhuma notificação no momento.</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onPress={handleNotificationPress}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F4EB' },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F4A63', marginBottom: 20 },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2DEC3', padding: 14, marginBottom: 14, alignItems: 'center' },
  cardUnread: { backgroundColor: '#F0F7FA', borderColor: '#CDE5EF' },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  senderAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#E2DEC3' },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 6 },
  senderName: { fontSize: 15, fontWeight: '700', color: '#1F4A63' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F4A63', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5C9DB8' },
  cardAction: { fontSize: 13, color: '#4B647A', marginBottom: 4 },
  cardDescription: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 6 },

  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 11, color: '#999' },
  dotSeparator: { fontSize: 11, color: '#999', marginHorizontal: 6 },
  markReadMiniText: { fontSize: 11, color: '#5C9DB8', fontWeight: '700' },

  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 8 },
  postPreviewContainer: { justifyContent: 'center', alignItems: 'center' },
  postPreviewImage: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#E2DEC3' },
  postPreviewFallback: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#F0F7FA', justifyContent: 'center', alignItems: 'center' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 },
  centerStateText: { color: '#5C9DB8', fontSize: 14, textAlign: 'center' },
  retryButton: { backgroundColor: '#5C9DB8', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600' },
});
