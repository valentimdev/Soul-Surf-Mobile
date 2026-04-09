import { chatService, ConversationResponse } from '@/services/chat/chatService';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ConversationItemView = {
  id: string;
  otherUserId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
};

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatConversationTime(createdAt?: string) {
  if (!createdAt) return '';

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60 * 1000) return 'Agora';

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `${diffMinutes} min`;

  if (isSameDay(now, date)) {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(yesterday, date)) return 'Ontem';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function toConversationView(item: ConversationResponse): ConversationItemView {
  const fallbackName = item.group ? 'Grupo' : 'Conversa';

  return {
    id: item.id,
    otherUserId: item.otherUserId,
    name: item.otherUserName || fallbackName,
    avatar: item.otherUserAvatarUrl || FALLBACK_AVATAR,
    lastMessage: item.lastMessage?.content || 'Sem mensagens ainda',
    time: formatConversationTime(item.lastMessage?.createdAt),
    unread: (item.unreadCount ?? 0) > 0,
  };
}

function ConversationCard({ item, onPress }: { item: ConversationItemView; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.conversationCard} activeOpacity={0.7} onPress={onPress}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.name}
          </Text>
          {!!item.time && (
            <Text style={[styles.timeText, item.unread && styles.timeTextUnread]}>
              {item.time}
            </Text>
          )}
        </View>

        <View style={styles.conversationFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread && <View style={styles.unreadBadge} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      setError(null);
      const response = await chatService.getMyConversations();
      setConversations(response.map(toConversationView));
    } catch (e) {
      console.error('Erro ao carregar conversas:', e);
      setError('Nao foi possivel carregar as conversas.');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const showCenteredLoader = loading && conversations.length === 0;
  const showRetry = !loading && !!error && conversations.length === 0;

  const handleOpenConversation = useCallback(
    (item: ConversationItemView) => {
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: item.id,
          name: item.name,
          avatar: item.avatar,
          otherUserId: item.otherUserId,
        },
      });
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Mensagens</Text>

        {showCenteredLoader ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#5C9DB8" />
            <Text style={styles.centerStateText}>Carregando conversas...</Text>
          </View>
        ) : showRetry ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadConversations()}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationCard item={item} onPress={() => handleOpenConversation(item)} />
            )}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshing={refreshing}
            onRefresh={() => loadConversations(true)}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma conversa encontrada.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F4EB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F4A63',
    marginBottom: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    backgroundColor: '#E2DEC3',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 10,
  },
  contactName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1F4A63',
  },
  timeText: {
    fontSize: 13,
    color: '#999',
  },
  timeTextUnread: {
    color: '#5C9DB8',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  lastMessage: {
    fontSize: 14,
    color: '#5C9DB8',
    flex: 1,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5C9DB8',
  },
  separator: {
    height: 1,
    backgroundColor: '#E2DEC3',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});
