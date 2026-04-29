import { beachService, BeachMessageDTO } from '@/services/beaches/beachService';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { BeachDTO, PostDTO } from '@/types/api';
import { SurfConditionsCard } from '@/components/surf/SurfConditionsCard';
import { surfConditionsService } from '@/services/weather/surfConditionsService';
import { SurfConditionsResponse } from '@/types/surfConditions';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
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
  Modal,
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

function sortMessagesByDateDesc(messages: (BeachMessageDTO | null | undefined)[]): BeachMessageDTO[] {
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

function isMessageFromToday(value?: string): boolean {
  if (!value) return false;

  const messageDate = new Date(value);
  if (Number.isNaN(messageDate.getTime())) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  return messageDate >= startOfToday && messageDate <= endOfToday;
}

function getBeachMessagesCacheKey(beachId: number): string {
  return `beach_messages_${beachId}`;
}

function parseCachedMessages(raw: string | null): BeachMessageDTO[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return sortMessagesByDateDesc(parsed as (BeachMessageDTO | null | undefined)[]);
  } catch {
    return [];
  }
}

export function PostCard({ post }: { post: PostDTO }) {
  const likesCount = normalizeCounter(post.likesCount);
  const commentsCount = normalizeCounter(post.commentsCount);

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text testID={`post-author-${post.id}`} style={styles.postAuthor}>{post.usuario?.username || 'Surfista'}</Text>
        <Text testID={`post-date-${post.id}`} style={styles.postDate}>{formatDate(post.data)}</Text>
      </View>
      {post.caminhoFoto ? <Image testID={`post-image-${post.id}`} source={{ uri: post.caminhoFoto }} style={styles.postImage} /> : null}
      {post.descricao ? <Text testID={`post-description-${post.id}`} style={styles.postDescription}>{post.descricao}</Text> : null}
      <View style={styles.postStats}>
        <Text testID={`post-likes-${post.id}`} style={styles.postStatsText}>{likesCount} curtidas</Text>
        <Text testID={`post-comments-${post.id}`} style={styles.postStatsText}>{commentsCount} comentarios</Text>
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
  const [surfConditions, setSurfConditions] = useState<SurfConditionsResponse | null>(null);
  const [surfConditionsError, setSurfConditionsError] = useState<string | null>(null);

  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostPhotoUri, setNewPostPhotoUri] = useState<string | null>(null);
  const [newPostBase64, setNewPostBase64] = useState<string | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);

  const messagesCacheKey = useMemo(() => {
    if (!Number.isFinite(beachId)) return null;
    return getBeachMessagesCacheKey(beachId);
  }, [beachId]);
  const todayMessages = useMemo(
    () => messages.filter((message) => isMessageFromToday(message.data)),
    [messages]
  );

  const persistMessagesCache = useCallback(async (nextMessages: BeachMessageDTO[]) => {
    if (!messagesCacheKey) return;
    try {
      const sorted = sortMessagesByDateDesc(nextMessages);
      await SecureStore.setItemAsync(messagesCacheKey, JSON.stringify(sorted.slice(0, 80)));
    } catch (cacheError) {
      console.error(cacheError);
    }
  }, [messagesCacheKey]);

  const loadMessagesCache = useCallback(async () => {
    if (!messagesCacheKey) return;
    try {
      const raw = await SecureStore.getItemAsync(messagesCacheKey);
      const cachedMessages = parseCachedMessages(raw);
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }
    } catch (cacheError) {
      console.error(cacheError);
    }
  }, [messagesCacheKey]);

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

    const beachPromise = beachService.getBeachById(beachId);
    const publicPostsPromise = beachService.getBeachPostsPublic(beachId);
    const myPostsPromise = beachService.getMyPosts();
    const messagesPromise = beachService.getBeachMessages(beachId);

    const beachData = await beachPromise;

    const hasValidCoordinates =
      Number.isFinite(beachData.latitude) &&
      Number.isFinite(beachData.longitude);

    const surfPromise = hasValidCoordinates
      ? surfConditionsService.getSurfConditions({
          lat: beachData.latitude,
          lon: beachData.longitude,
          beach: beachData.nome,
        })
      : Promise.resolve(null);

    const [publicPostsResult, myPostsResult, messagesResult, surfResult] =
      await Promise.allSettled([
        publicPostsPromise,
        myPostsPromise,
        messagesPromise,
        surfPromise,
      ]);

    const publicPosts =
      publicPostsResult.status === 'fulfilled'
        ? publicPostsResult.value
        : [];

    const myPosts =
      myPostsResult.status === 'fulfilled'
        ? myPostsResult.value
        : [];

    const myBeachPosts = myPosts.filter(
      (post) => post.beach?.id === beachId
    );

    const merged = [...publicPosts, ...myBeachPosts];

    const uniquePosts = merged.filter(
      (post, index, self) =>
        index === self.findIndex((p) => p.id === post.id)
    );

    const beachMessages =
      messagesResult.status === 'fulfilled'
        ? sortMessagesByDateDesc(messagesResult.value || [])
        : null;

    if (surfResult.status === 'rejected') {
      setSurfConditionsError(
        'Nao foi possivel carregar onda, vento e balneabilidade agora.'
      );
    } else if (surfResult.value) {
      setSurfConditions(surfResult.value);
      setSurfConditionsError(null);
    } else {
      setSurfConditions(null);
      setSurfConditionsError(
        'Este pico ainda nao tem coordenadas para leitura automatica do mar.'
      );
    }

    setBeach(beachData);
    setPosts(uniquePosts.filter(Boolean));

    if (beachMessages) {
      if (beachMessages.length > 0) {
        setMessages(beachMessages);
        void persistMessagesCache(beachMessages);
      } else {
        setMessages((prev) => (prev.length > 0 ? prev : []));
      }
    }
  } catch (e) {
    console.error(e);
    setError('Nao foi possivel carregar os dados da praia.');
  } finally {
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }
}, [beachId, persistMessagesCache]);

  useEffect(() => {
    void loadMessagesCache();
  }, [loadMessagesCache]);

  useEffect(() => {
    loadBeachDetails();
  }, [loadBeachDetails]);

  useEffect(() => {
    if (beach?.nome) {
      navigation.setOptions({ title: beach.nome });
    }
  }, [beach?.nome, navigation]);

  useEffect(() => {
    setSurfConditions(null);
    setSurfConditionsError(null);
  }, [beachId]);

  const handleSendMessage = useCallback(async () => {
    if (!Number.isFinite(beachId)) return;
    if (!newMessage.trim()) {
      Alert.alert('Aviso', 'Escreva uma mensagem antes de enviar.');
      return;
    }

    setSendingMessage(true);
    try {
      const created = await beachService.postBeachMessage(beachId, newMessage.trim());
      setMessages((prev) => {
        const next = sortMessagesByDateDesc([created, ...prev]);
        void persistMessagesCache(next);
        return next;
      });
      setNewMessage('');
      void loadBeachDetails(true);
    } catch (e) {
        console.error(e);
      Alert.alert('Erro', 'Nao foi possivel publicar sua mensagem.');
    } finally {
      setSendingMessage(false);
    }
  }, [beachId, newMessage, loadBeachDetails, persistMessagesCache]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setNewPostPhotoUri(result.assets[0].uri);
      setNewPostBase64(result.assets[0].base64 || null);
    }
  };

  const closePostModal = () => {
    setIsPostModalVisible(false);
    setNewPostDesc('');
    setNewPostPhotoUri(null);
    setNewPostBase64(null);
  };

const handleCreatePost = async () => {
  if (!newPostDesc.trim() && !newPostPhotoUri) {
    Alert.alert('Aviso', 'Seu post precisa ter ao menos uma foto ou uma descrição.');
    return;
  }

  setCreatingPost(true);

  try {
    const formData = new FormData();

    formData.append('publico', 'true');
    formData.append('descricao', newPostDesc.trim() || '');
    formData.append('beachId', String(beachId));

    if (newPostPhotoUri) {
      formData.append('foto', {
        uri: newPostPhotoUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);
    }

    const response = await api.post('/api/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('POST CRIADO:', response.data);

    // 👇 Atualiza imediatamente
    setPosts(prev => [response.data, ...prev]);

    closePostModal();
    Alert.alert('Sucesso', 'Post publicado com sucesso!');

  } catch (error: any) {
    console.error(error?.response?.data || error.message);
    Alert.alert('Erro', 'Não foi possível criar o post.');
  } finally {
    setCreatingPost(false);
  }

};

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
              <Text style={styles.sectionTitle}>Condicoes do mar agora</Text>
              <Text style={styles.sectionDescription}>
                Leitura simples com onda, vento e balneabilidade para facilitar sua decisao no pico.
              </Text>

              {surfConditions ? (
                <SurfConditionsCard beachName={beach?.nome} data={surfConditions} />
              ) : loading ? (
                <View style={styles.surfLoadingBox}>
                  <ActivityIndicator size="small" color="#5C9DB8" />
                  <Text style={styles.emptyStateText}>Carregando condicoes do mar...</Text>
                </View>
              ) : surfConditionsError ? (
                <Text style={styles.warningText}>{surfConditionsError}</Text>
              ) : (
                <Text style={styles.emptyStateText}>Sem dados de condicoes para este pico agora.</Text>
              )}
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

              {todayMessages.length === 0 ? (
                <Text style={styles.emptyStateText}>Ainda nao ha comentarios de hoje neste mural.</Text>
              ) : (
                <ScrollView
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesListContent}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {todayMessages.map((message, index) => (
                    <MessageCard key={message.id ?? `message-${index}`} message={message} />
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderWithButton}>
                <Text style={styles.sectionTitleWithoutMargin}>Posts da praia</Text>
                <TouchableOpacity onPress={() => setIsPostModalVisible(true)} style={styles.addPostBtn}>
                  <Text style={styles.addPostBtnText}>Adicionar post</Text>
                </TouchableOpacity>
              </View>

              {posts.length === 0 ? (
                <Text style={styles.emptyStateText}>Ainda nao ha posts publicos para esta praia.</Text>
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={isPostModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePostModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Post</Text>
              <TouchableOpacity onPress={closePostModal}>
                <Ionicons name="close" size={26} color="#1F4A63" />
              </TouchableOpacity>
            </View>

            {newPostPhotoUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: newPostPhotoUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => {
                    setNewPostPhotoUri(null);
                    setNewPostBase64(null);
                  }}
                >
                  <Ionicons name="trash" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={24} color="#5C9DB8" />
                <Text style={styles.addPhotoText}>Adicionar Foto (Opcional)</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.modalTextInput}
              placeholder="O que rolou no mar hoje? (Opcional)"
              placeholderTextColor="#8B8B8B"
              value={newPostDesc}
              onChangeText={setNewPostDesc}
              multiline
            />

            <TouchableOpacity
              style={[styles.modalButton, (creatingPost || (!newPostDesc.trim() && !newPostBase64)) && { opacity: 0.6 }]}
              onPress={handleCreatePost}
              disabled={creatingPost || (!newPostDesc.trim() && !newPostBase64)}
            >
              {creatingPost ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.modalButtonText}>Publicar Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  sectionHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleWithoutMargin: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F4A63',
  },
  addPostBtn: {
    backgroundColor: '#E2DEC3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addPostBtnText: {
    color: '#1F4A63',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#4B647A',
    lineHeight: 18,
    marginBottom: 10,
  },
  messageComposer: {
    marginBottom: 12,
  },
  messagesList: {
    maxHeight: 320,
  },
  messagesListContent: {
    paddingBottom: 4,
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
  warningText: {
    fontSize: 13,
    color: '#8D2E2E',
    lineHeight: 18,
  },
  surfLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#F6F4EB',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F4A63',
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F0F5',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#5C9DB8',
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 16,
    gap: 10,
  },
  addPhotoText: {
    color: '#5C9DB8',
    fontWeight: '600',
    fontSize: 15,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 20,
  },
  modalTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DEC3',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F4A63',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#5C9DB8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
