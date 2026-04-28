import { chatService, ConversationResponse } from '@/services/chat/chatService';
import { userService } from '@/services/users/userService';
import { UserDTO } from '@/types/api';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityIndicator,
  Alert,
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

const FALLBACK_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

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

// NOVO: Recebe o currentUserId para verificar a autoria da última mensagem
function toConversationView(item: ConversationResponse, currentUserId: string): ConversationItemView {
  const fallbackName = item.group ? 'Grupo' : 'Conversa';

  // Verifica se fomos nós que mandamos a última mensagem
  const isMyLastMessage = String(item.lastMessage?.senderId) === currentUserId;

  return {
    id: item.id,
    otherUserId: item.otherUserId,
    name: item.otherUserName || fallbackName,
    avatar: item.otherUserAvatarUrl || FALLBACK_AVATAR,
    lastMessage: item.lastMessage?.content || 'Sem mensagens ainda',
    time: formatConversationTime(item.lastMessage?.createdAt),
    // SÓ mostra a bolinha azul se a última mensagem NÃO for nossa E o contador for maior que 0
    unread: !isMyLastMessage && (item.unreadCount ?? 0) > 0,
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
  const [following, setFollowing] = useState<UserDTO[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  // NOVO: Uma única função que carrega tudo em paralelo de forma eficiente
  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setLoadingFollowing(true);
    }

    try {
      setError(null);

      // 1. Descobrimos quem somos nós
      const myProfile = await userService.getMyProfile();
      const currentId = String(myProfile.id);

      // 2. Buscamos Seguindo e Conversas ao MESMO TEMPO (mais rápido)
      const [followingData, conversationsData] = await Promise.all([
        userService.getFollowing(myProfile.id).catch(() => []), // Falha silenciosa pro topo
        chatService.getMyConversations()
      ]);
    console.log("DADOS COMPLETOS DOS SEGUIDOS:", JSON.stringify(followingData, null, 2));

      setFollowing(followingData);

      // 3. Montamos a lista passando o nosso ID para evitar o bug do "Não Lido"
      setConversations(conversationsData.map(c => toConversationView(c, currentId)));

    } catch (e) {
      console.error('Erro ao carregar dados da tela de chat:', e);
      setError('Não foi possível carregar as conversas.');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
      setLoadingFollowing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  const showCenteredLoader = loading && conversations.length === 0;
  const showRetry = !loading && !!error && conversations.length === 0;

  const handleOpenConversation = useCallback(
    (item: ConversationItemView) => {
      router.push({
        pathname: '../chat/[id]',
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

  const handleStartChatWithFollowed = async (user: UserDTO) => {
    if (startingChat) return;
    setStartingChat(true);
    try {
      const conversationId = await chatService.createOrGetDM(String(user.id));

      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conversationId,
          name: user.username,
          avatar: user.fotoPerfil || FALLBACK_AVATAR,
          otherUserId: String(user.id),
        },
      });
    } catch (err) {
      console.error('Erro ao iniciar chat', err);
      Alert.alert('Erro', 'Não foi possível abrir a conversa no momento.');
    } finally {
      setStartingChat(false);
    }
  };

  const renderListHeader = () => {
    if (loadingFollowing) {
      return (
        <View style={styles.followingContainer}>
          <ActivityIndicator size="small" color="#5C9DB8" />
        </View>
      );
    }

    if (following.length === 0) return null;

    return (
      <View style={styles.followingContainer}>
        <Text style={styles.followingTitle}>Iniciar conversa</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={following}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.followingItem, startingChat && { opacity: 0.5 }]}
              activeOpacity={0.7}
              onPress={() => handleStartChatWithFollowed(item)}
              disabled={startingChat}
            >
              <Image
                source={{ uri: item.fotoPerfil || FALLBACK_AVATAR }}
                style={styles.followingAvatar}
              />
              <Text style={styles.followingName} numberOfLines={1}>
                {item.username}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.title}>Mensagens</Text>
          <TouchableOpacity
            style={styles.usersButton}
            onPress={() => router.push('/users')}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={24} color="#1F4A63" />
            <Text style={styles.usersButtonText}>Descobrir</Text>
          </TouchableOpacity>
        </View>

        {showCenteredLoader ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#5C9DB8" />
            <Text style={styles.centerStateText}>Carregando conversas...</Text>
          </View>
        ) : showRetry ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadAllData()}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderListHeader}
            renderItem={({ item }) => (
              <ConversationCard item={item} onPress={() => handleOpenConversation(item)} />
            )}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshing={refreshing}
            onRefresh={() => loadAllData(true)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F4A63',
  },
  usersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2DEC3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  usersButtonText: {
    color: '#1F4A63',
    fontWeight: '600',
    fontSize: 14,
  },
  followingContainer: {
    paddingVertical: 5,
    marginBottom: 15,
  },
  followingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F4A63',
    marginBottom: 12,
  },
  followingItem: {
    alignItems: 'center',
    width: 65,
    marginRight: 12,
  },
  followingAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2DEC3',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#5C9DB8',
  },
  followingName: {
    fontSize: 12,
    color: '#1F4A63',
    textAlign: 'center',
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