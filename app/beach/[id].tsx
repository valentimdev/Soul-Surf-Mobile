import { beachService, BeachMessageDTO } from '@/services/beaches/beachService';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { BeachDTO, PostDTO } from '@/types/api';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';



function normalizeCounter(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (Array.isArray(value)) return value.length;
  return 0;
}

function sortMessagesByDateDesc(messages: Array<BeachMessageDTO | null | undefined>): BeachMessageDTO[] {
  return messages
    .filter((message): message is BeachMessageDTO => Boolean(message))
    .sort((a, b) => {
      const first = new Date(a.data).getTime();
      const second = new Date(b.data).getTime();
      const safeFirst = Number.isNaN(first) ? 0 : first;
      const safeSecond = Number.isNaN(second) ? 0 : second;
      return safeSecond - safeFirst;
    });
}

export function PostCard({ post }: { post: PostDTO }) {
function PostCard({ post }: { post: PostDTO }) {
  const likesCount = normalizeCounter(post.likesCount);
  const commentsCount = normalizeCounter(post.commentsCount);

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text testID={`post-author-${post.id}`} style={styles.postAuthor}>{post.usuario?.username || 'Surfista'}</Text>
        <Text testID={`post-date-${post.id}`} style={styles.postDate}>{formatDate(post.data)}</Text>
      </View>
      {post.caminhoFoto ? <Image testID={`post-image-${post.id}`} source={{ uri: post.caminhoFoto }} style={styles.postImage} /> : null}
      <Text testID={`post-description-${post.id}`} style={styles.postDescription}>{post.descricao || 'Sem descricao.'}</Text>
      <View style={styles.postStats}>
        <Text testID={`post-likes-${post.id}`} style={styles.postStatsText}>{post.likesCount ?? 0} curtidas</Text>
        <Text testID={`post-comments-${post.id}`} style={styles.postStatsText}>{post.commentsCount ?? 0} comentarios</Text>
        <Text style={styles.postStatsText}>{likesCount} curtidas</Text>
        <Text style={styles.postStatsText}>{commentsCount} comentarios</Text>
      </View>
    </View>
  );
}

function MessageCard({ message }: { message: BeachMessageDTO }) {
  return (
    <View style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <Text testID={`message-author-${message.id}`} style={styles.messageAuthor}>{message.autor?.username || 'Surfista'}</Text>
        <Text testID={`message-date-${message.id}`} style={styles.messageDate}>{formatDateTime(message.data)}</Text>
      </View>
      <Text testID={`message-text-${message.id}`} style={styles.messageText}>{message.texto}</Text>
    </View>
  );
}

export default function BeachDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const navigation = useNavigation();
  const beachId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    return Number(raw);
  }, [params.id]);

  const [beach, setBeach] = useState<BeachDTO | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [messages, setMessages] = useState<BeachMessageDTO[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBeachDetails = useCallback(async (isRefresh = false) => {
    if (!Number.isFinite(beachId)) {
      setError('Praia invalida.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      setError(null);
      const [beachResult, postsResult, messagesResult] = await Promise.allSettled([
        beachService.getBeachById(beachId),
        beachService.getBeachPosts(beachId),
        beachService.getBeachMessages(beachId),
      ]);

      if (beachResult.status === 'rejected') {
        throw beachResult.reason;
      }

      const beachData = beachResult.value;
      const beachPosts = postsResult.status === 'fulfilled' ? postsResult.value : [];
      const beachMessages = messagesResult.status === 'fulfilled' ? messagesResult.value : [];

      if (postsResult.status === 'rejected') {
        console.error('Erro ao carregar posts da praia:', postsResult.reason);
      }

      if (messagesResult.status === 'rejected') {
        console.error('Erro ao carregar mensagens da praia:', messagesResult.reason);
      }

      setBeach(beachData);
      setPosts((beachPosts || []).filter(Boolean));
      setMessages(sortMessagesByDateDesc(beachMessages || []));
    } catch (e) {
      console.error('Erro ao carregar detalhes da praia:', e);
      setError('Nao foi possivel carregar os dados da praia.');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [beachId]);

  useEffect(() => {
    loadBeachDetails();
  }, [loadBeachDetails]);

  useEffect(() => {
    if (beach?.nome) {
      navigation.setOptions({ title: beach.nome });
    }
  }, [beach?.nome, navigation]);

  const handleSendMessage = useCallback(async () => {
    if (!Number.isFinite(beachId)) return;
    if (!newMessage.trim()) {
      Alert.alert('Aviso', 'Escreva uma mensagem antes de enviar.');
      return;
    }

    setSendingMessage(true);
    try {
      const created = await beachService.postBeachMessage(beachId, newMessage.trim());
      setMessages((prev) => sortMessagesByDateDesc([created, ...prev]));
      setNewMessage('');
    } catch (e) {
      console.error('Erro ao enviar mensagem da praia:', e);
      Alert.alert('Erro', 'Nao foi possivel publicar sua mensagem.');
    } finally {
      setSendingMessage(false);
    }
  }, [beachId, newMessage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBeachDetails(true)} />}
      >
        {loading && !beach ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#5C9DB8" />
            <Text style={styles.centerStateText}>Carregando detalhes da praia...</Text>
          </View>
        ) : error && !beach ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadBeachDetails()}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              {beach?.caminhoFoto ? <Image testID="beach-image" source={{ uri: beach.caminhoFoto }} style={styles.heroImage} /> : null}
              <Text testID="beach-name" style={styles.beachName}>{beach?.nome}</Text>
              {beach?.descricao ? <Text testID="beach-description" style={styles.beachDescription}>{beach.descricao}</Text> : null}
              <Text testID="beach-location" style={styles.beachMeta}>Local: {beach?.localizacao || 'Nao informado'}</Text>
              <Text testID="beach-experience" style={styles.beachMeta}>Nivel: {beach?.nivelExperiencia || 'Nao informado'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comentarios da praia</Text>
              <View style={styles.messageComposer}>
                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
                  style={styles.messageInput}
                  placeholder="Compartilhe uma dica ou condicao do mar..."
                  placeholderTextColor="#8B8B8B"
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendButton, sendingMessage && { opacity: 0.6 }]}
                  onPress={handleSendMessage}
                  disabled={sendingMessage}
                >
                  <Text style={styles.sendButtonText}>{sendingMessage ? 'Enviando...' : 'Publicar'}</Text>
                </TouchableOpacity>
              </View>

              {messages.length === 0 ? (
                <Text style={styles.emptyStateText}>Ainda nao ha mensagens neste mural.</Text>
              ) : (
                messages.map((message, index) => (
                  <MessageCard key={message.id ?? `message-${index}`} message={message} />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Posts da praia</Text>
              {posts.length === 0 ? (
                <Text style={styles.emptyStateText}>Ainda nao ha posts publicos para esta praia.</Text>
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </View>
          </>
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
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2DEC3',
    padding: 14,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#E8E5D4',
  },
  beachName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F4A63',
    marginBottom: 8,
  },
  beachDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 10,
    lineHeight: 20,
  },
  beachMeta: {
    fontSize: 13,
    color: '#5C9DB8',
    fontWeight: '600',
    marginBottom: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2DEC3',
    padding: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F4A63',
    marginBottom: 10,
  },
  messageComposer: {
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E2DEC3',
    borderRadius: 12,
    minHeight: 84,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F4A63',
    backgroundColor: '#FAFAF9',
    textAlignVertical: 'top',
  },
  sendButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: '#1F4A63',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  messageCard: {
    borderWidth: 1,
    borderColor: '#EAE7DA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FCFBF6',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  messageAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F4A63',
    flex: 1,
  },
  messageDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  postCard: {
    borderWidth: 1,
    borderColor: '#EAE7DA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#FCFBF6',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  postAuthor: {
    fontSize: 14,
    color: '#1F4A63',
    fontWeight: '700',
    flex: 1,
  },
  postDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  postImage: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#E8E5D4',
  },
  postDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postStatsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6B7280',
  },
  centerState: {
    flex: 1,
    minHeight: 300,
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
});
