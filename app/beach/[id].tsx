import { beachService, BeachMessageDTO } from '@/services/beaches/beachService';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { BeachDTO, PostDTO } from '@/types/api';
import { surfConditionsService } from '@/services/weather/surfConditionsService';
import { SurfConditionsResponse } from '@/types/surfConditions';
import {
  buildQuickTips,
  buildLaymanSummary,
  formatMetric,
  toCompass,
} from '@/utils/surfConditionsInterpreter';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { postService } from '@/services/posts/postService';
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
  useWindowDimensions,
  View,
  Modal,
} from 'react-native';

const FALLBACK_BEACH_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';

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

export function PostCard({ post, featured = false }: { post: PostDTO; featured?: boolean }) {
  const router = useRouter();
  const initialLikes = normalizeCounter(post.likesCount);
  const commentsCount = normalizeCounter(post.commentsCount);
  const authorName = post.usuario?.username || 'Surfista';
  const authorAvatar = post.usuario?.fotoPerfil;

  // Estados locais do componente para controle do like
  const [liked, setLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(initialLikes);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      postService.getLikeStatus(post.id),
      postService.getLikesCount(post.id)
    ])
      .then(([statusRes, countRes]) => {
        if (mounted) {
          setLiked(statusRes.liked);
          setLikesCount(countRes.count);
        }
      })
      .catch(error => {
        console.error('Erro ao buscar dados do like:', error);
      });

    return () => { mounted = false; };
  }, [post.id]);

  const handleToggleLike = async () => {
    if (isLiking) return;

    const previousLiked = liked;
    const previousCount = likesCount;

    setLiked(!previousLiked);
    setLikesCount(prev => prev + (!previousLiked ? 1 : -1));
    setIsLiking(true);

    try {
      const res = await postService.toggleLike(post.id);
      setLiked(res.liked);
    } catch (error) {
      console.error('Erro ao curtir:', error);
      setLiked(previousLiked);
      setLikesCount(previousCount);
      Alert.alert('Erro', 'Não foi possível curtir o post.');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <View style={[styles.postCard, featured && styles.postCardFeatured]}>
      {featured ? (
        <View style={styles.featuredRecordBanner}>
          <Ionicons name="trophy-outline" size={15} color="#2F6F86" />
          <Text style={styles.featuredRecordText}>Registro em destaque da praia</Text>
        </View>
      ) : null}

      <View style={styles.postHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            post.usuario?.id &&
            router.push(`/user/${post.usuario.id}` as Href)
          }
          style={styles.authorRow}
        >
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.postAvatar} />
          ) : (
            <View style={styles.postAvatarFallback}>
              <Text style={styles.avatarFallbackText}>{authorName[0]}</Text>
            </View>
          )}
          <View style={styles.authorTextBlock}>
            <Text testID={`post-author-${post.id}`} style={styles.postAuthor}>
              {authorName}
            </Text>
            <Text testID={`post-date-${post.id}`} style={styles.postDate}>
              {formatDate(post.data)}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.recordTypeBadge}>
          <Text style={styles.recordTypeBadgeText}>Registro</Text>
        </View>
      </View>

      {post.descricao ? (
        <Text testID={`post-description-${post.id}`} style={styles.postDescription}>
          {post.descricao}
        </Text>
      ) : null}

      {post.caminhoFoto ? (
        <View style={styles.postImageFrame}>
          <Image testID={`post-image-${post.id}`} source={{ uri: post.caminhoFoto }} style={styles.postImage} />
        </View>
      ) : null}

      <View style={styles.postFooter}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleLike}
          disabled={isLiking}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={18}
            color={liked ? "#C54A54" : "#6B7280"}
          />
          <Text style={[styles.actionText, liked && styles.actionTextLiked]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={17} color="#6B7280" />
          <Text style={styles.actionText}>
            {commentsCount} {commentsCount === 1 ? 'comentario' : 'comentarios'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function MessageCard({ message }: { message: BeachMessageDTO }) {
  const router = useRouter();
  const authorName = message.autor?.username || 'Surfista';
  const authorAvatar = message.autor?.fotoPerfil;

  return (
    <View style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            message.autor?.id &&
            router.push(`/user/${message.autor.id}` as Href)
          }
          style={styles.authorRow}
        >
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.messageAvatar} />
          ) : (
            <View style={styles.messageAvatarFallback}>
              <Text style={styles.messageAvatarFallbackText}>{authorName[0]}</Text>
            </View>
          )}
          <View style={styles.authorTextBlock}>
            <Text testID={`message-author-${message.id}`} style={styles.messageAuthor}>
              {authorName}
            </Text>
            <Text testID={`message-date-${message.id}`} style={styles.messageDate}>{formatDateTime(message.data)}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <Text testID={`message-text-${message.id}`} style={styles.messageText}>{message.texto}</Text>
    </View>
  );
}

function SimpleSurfConditions({ data }: { data: SurfConditionsResponse }) {
  const summary = buildLaymanSummary(data);
  const quickTips = buildQuickTips(data);
  const waveHeight = formatMetric(data.marine?.waveHeightMeters, 'm');
  const wavePeriod = formatMetric(data.marine?.wavePeriodSeconds, 's', 0);
  const windSpeed = formatMetric(data.wind?.windSpeedKmh, 'km/h');
  const windDirection = toCompass(data.wind?.windDirectionDegrees);
  const waterTemp = formatMetric(data.marine?.seaSurfaceTemperatureC, '°C');
  const balneabilityStatus = data.balneability?.overallStatus ?? 'INDISPONIVEL';
  const reportUrl = data.balneability?.reportUrl?.trim();

  const openReport = async () => {
    if (!reportUrl) return;
    try {
      await Linking.openURL(reportUrl);
    } catch {
      Alert.alert('Nao foi possivel abrir o boletim', 'Tente novamente em alguns instantes.');
    }
  };

  return (
    <View style={styles.simpleSurfContent}>
      <View style={styles.simpleSurfTitleRow}>
        <Ionicons name="navigate-outline" size={17} color="#2F6F86" />
        <Text style={styles.simpleSurfTitle}>Condições atuais</Text>
      </View>

      <View style={styles.simpleSurfGrid}>
        <View style={styles.simpleSurfMetric}>
          <Ionicons name="thermometer-outline" size={18} color="#6B7280" style={styles.simpleSurfMetricIcon} />
          <View style={styles.simpleSurfMetricBody}>
            <Text style={styles.simpleSurfLabel}>Temperatura</Text>
            <Text style={styles.simpleSurfValue}>{waterTemp}</Text>
          </View>
        </View>

        <View style={styles.simpleSurfMetric}>
          <Ionicons name="navigate-outline" size={18} color="#6B7280" style={styles.simpleSurfMetricIcon} />
          <View style={styles.simpleSurfMetricBody}>
            <Text style={styles.simpleSurfLabel}>Vento</Text>
            <Text style={styles.simpleSurfValue}>{windSpeed} {windDirection}</Text>
          </View>
        </View>

        <View style={styles.simpleSurfMetric}>
          <Ionicons name="water-outline" size={18} color="#6B7280" style={styles.simpleSurfMetricIcon} />
          <View style={styles.simpleSurfMetricBody}>
            <Text style={styles.simpleSurfLabel}>Ondas</Text>
            <Text style={styles.simpleSurfValue}>{waveHeight} / {wavePeriod}</Text>
          </View>
        </View>

        <View style={styles.simpleSurfMetric}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" style={styles.simpleSurfMetricIcon} />
          <View style={styles.simpleSurfMetricBody}>
            <Text style={styles.simpleSurfLabel}>Balneabilidade</Text>
            <Text style={styles.simpleSurfValue}>{balneabilityStatus}</Text>
          </View>
        </View>
      </View>

      <View style={styles.simpleSurfWideMetric}>
        <Ionicons name="eye-outline" size={18} color="#6B7280" />
        <View style={{ flex: 1 }}>
          <Text style={styles.simpleSurfLabel}>Resumo</Text>
          <Text style={styles.simpleSurfValue}>{summary.title}</Text>
          <Text style={styles.simpleSurfHelper}>{summary.message}</Text>
        </View>
      </View>

      <View style={styles.simpleSurfDivider} />

      <View style={styles.simpleSurfBlock}>
        <Text style={styles.simpleSurfBlockTitle}>Dicas rapidas</Text>
        {quickTips.map((tip) => (
          <View key={tip} style={styles.simpleSurfTipRow}>
            <View style={styles.simpleSurfTipDot} />
            <Text style={styles.simpleSurfTipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={styles.simpleSurfDivider} />

      <View style={styles.simpleSurfBlock}>
        <View style={styles.simpleSurfReportHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.simpleSurfBlockTitle}>Boletim SEMACE</Text>
          </View>
        </View>
        {reportUrl ? (
          <TouchableOpacity onPress={openReport} style={styles.simpleSurfReportButton}>
            <Ionicons name="open-outline" size={15} color="#FFFFFF" />
            <Text style={styles.simpleSurfReportButtonText}>Abrir boletim da SEMACE</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.simpleSurfReportText}>Boletim oficial indisponível para este pico agora.</Text>
        )}
      </View>
    </View>
  );
}

export default function BeachDetailsScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ id?: string | string[], targetPostId?: string, scrollToPost?: string }>();
  // Alterado para aceitar tanto targetPostId quanto scrollToPost (usado na tela de Discover)
  const targetPostId = useMemo(() => {
    const target = params.targetPostId || params.scrollToPost;
    return target ? Number(target) : null;
  }, [params.targetPostId, params.scrollToPost]);

  const mainScrollRef = React.useRef<ScrollView>(null);
  const postsScrollRef = React.useRef<ScrollView>(null);
  const postLayoutPositions = React.useRef<{ [key: number]: number }>({});
  const postsSectionY = React.useRef<number>(0);

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
  const [activeBeachTab, setActiveBeachTab] = useState<'records' | 'comments'>('records');

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
      navigation.setOptions({
        title: beach.nome,
        headerTitle: () => (
          <View style={styles.navigationHeaderTitle}>
            <Text numberOfLines={1} style={styles.navigationHeaderName}>
              {beach.nome}
            </Text>
            <Text numberOfLines={1} style={styles.navigationHeaderSubtitle}>
              Pico de surf
            </Text>
          </View>
        ),
      });
    }
  }, [beach?.nome, navigation]);

  useEffect(() => {
    setSurfConditions(null);
    setSurfConditionsError(null);
  }, [beachId]);

  useEffect(() => {
    if (!loading && posts.length > 0 && targetPostId) {
      setTimeout(() => {
        if (mainScrollRef.current && postsSectionY.current > 0) {
          mainScrollRef.current.scrollTo({ y: postsSectionY.current - 20, animated: true });
        }

        const targetY = postLayoutPositions.current[targetPostId];
        if (postsScrollRef.current && targetY !== undefined) {
          postsScrollRef.current.scrollTo({ y: targetY, animated: true });
        }
      }, 500);
    }
  }, [loading, posts, targetPostId]);

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
        ref={mainScrollRef}
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
            <Image
              testID="beach-image"
              source={{ uri: beach?.caminhoFoto || FALLBACK_BEACH_IMAGE }}
              style={[styles.beachPhoto, { width: windowWidth }]}
              resizeMode="cover"
            />

            <View style={[styles.section, styles.surfSection]}>
              <View style={styles.surfSectionHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>Agora no pico</Text>
                  <Text style={styles.sectionTitleWithoutMargin}>Condições do mar</Text>
                </View>
                <Ionicons name="partly-sunny-outline" size={22} color="#2F6F86" />
              </View>

              {surfConditions ? (
                <SimpleSurfConditions data={surfConditions} />
              ) : loading ? (
                <View style={styles.surfLoadingBox}>
                  <ActivityIndicator size="small" color="#2F6F86" />
                  <Text style={styles.emptyStateText}>Carregando condições do mar...</Text>
                </View>
              ) : surfConditionsError ? (
                <Text style={styles.warningText}>{surfConditionsError}</Text>
              ) : (
                <Text style={styles.emptyStateText}>Sem dados de condições para este pico agora.</Text>
              )}
            </View>

            <View
              style={styles.section}
              onLayout={(e) => { postsSectionY.current = e.nativeEvent.layout.y; }}
            >
              <View style={styles.beachTabsHeader}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setActiveBeachTab('records')}
                  style={[
                    styles.beachTabButton,
                    activeBeachTab === 'records' && styles.beachTabButtonActive,
                  ]}
                >
                  <Ionicons
                    name="images-outline"
                    size={16}
                    color={activeBeachTab === 'records' ? '#FFFFFF' : '#2F6F86'}
                  />
                  <Text
                    style={[
                      styles.beachTabText,
                      activeBeachTab === 'records' && styles.beachTabTextActive,
                    ]}
                  >
                    Registros
                  </Text>
                  <View
                    style={[
                      styles.beachTabCount,
                      activeBeachTab === 'records' && styles.beachTabCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.beachTabCountText,
                        activeBeachTab === 'records' && styles.beachTabCountTextActive,
                      ]}
                    >
                      {posts.length}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setActiveBeachTab('comments')}
                  style={[
                    styles.beachTabButton,
                    activeBeachTab === 'comments' && styles.beachTabButtonActive,
                  ]}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={16}
                    color={activeBeachTab === 'comments' ? '#FFFFFF' : '#2F6F86'}
                  />
                  <Text
                    style={[
                      styles.beachTabText,
                      activeBeachTab === 'comments' && styles.beachTabTextActive,
                    ]}
                  >
                    Comentarios
                  </Text>
                  <View
                    style={[
                      styles.beachTabCount,
                      activeBeachTab === 'comments' && styles.beachTabCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.beachTabCountText,
                        activeBeachTab === 'comments' && styles.beachTabCountTextActive,
                      ]}
                    >
                      {todayMessages.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {activeBeachTab === 'records' ? (
                <>
                  <View style={styles.sectionHeaderWithButton}>
                    <View>
                      <Text style={styles.sectionEyebrow}>Historico visual</Text>
                      <Text style={styles.sectionTitleWithoutMargin}>Registros</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsPostModalVisible(true)} style={styles.addPostBtn}>
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.addPostBtnText}>Novo</Text>
                    </TouchableOpacity>
                  </View>

                  {posts.length === 0 ? (
                    <View style={styles.emptyStateBox}>
                      <Ionicons name="images-outline" size={20} color="#6B7280" />
                      <Text style={styles.emptyStateText}>Ainda nao ha registros publicos para esta praia.</Text>
                    </View>
                  ) : (
                    <ScrollView
                      ref={postsScrollRef}
                      style={styles.postsList}
                      contentContainerStyle={styles.postsListContent}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                    >
                      {posts.map((post) => (
                        <View
                          key={post.id}
                          onLayout={(e) => {
                            postLayoutPositions.current[post.id] = e.nativeEvent.layout.y;
                          }}
                        >
                          <PostCard post={post} featured={post.id === posts[0]?.id} />
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </>
              ) : (
                <View>
                  <View style={styles.sectionHeaderStack}>
                    <View>
                      <Text style={styles.sectionEyebrow}>Mural do pico</Text>
                      <Text style={styles.sectionTitleWithoutMargin}>Comentarios</Text>
                    </View>

                  </View>

                  <View style={styles.relevanceHint}>
                    <Ionicons name="trending-up-outline" size={15} color="#6B7280" />
                    <Text style={styles.relevanceHintText}>
                      Comentarios recentes aparecem primeiro para mostrar o que esta rolando agora.
                    </Text>
                  </View>

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
              <View>
                <Text style={styles.modalEyebrow}>Historico visual</Text>
                <Text style={styles.modalTitle}>Novo registro</Text>
              </View>
              <TouchableOpacity onPress={closePostModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={22} color="#1F4A63" />
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
                <Text style={styles.addPhotoText}>Adicionar foto</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.modalTextInput}
              placeholder="O que rolou no mar hoje?"
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
                <Text style={styles.modalButtonText}>Publicar registro</Text>
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
  navigationHeaderTitle: {
    minWidth: 0,
  },
  navigationHeaderName: {
    color: '#2A4B7C',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 23,
  },
  navigationHeaderSubtitle: {
    color: '#5D9AB6',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 17,
  },
  beachPhoto: {
    width: '100%',
    height: 210,
    marginHorizontal: -20,
    marginTop: -16,
    backgroundColor: '#E7E2D3',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E2D3',
    padding: 14,
    shadowColor: '#1F4A63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
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
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  sectionHeaderStack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: 3,
  },
  sectionTitleWithoutMargin: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F4A63',
  },
  sectionCounterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#E7F1F4',
  },
  sectionCounterText: {
    color: '#2F6F86',
    fontSize: 12,
    fontWeight: '800',
  },
  beachTabsHeader: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F3F1EA',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  beachTabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  beachTabButtonActive: {
    backgroundColor: '#2F6F86',
    shadowColor: '#2F6F86',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 2,
  },
  beachTabText: {
    color: '#2F6F86',
    fontSize: 13,
    fontWeight: '800',
  },
  beachTabTextActive: {
    color: '#FFFFFF',
  },
  beachTabCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  beachTabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  beachTabCountText: {
    color: '#2F6F86',
    fontSize: 11,
    fontWeight: '900',
  },
  beachTabCountTextActive: {
    color: '#FFFFFF',
  },
  addPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2F6F86',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addPostBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#4B647A',
    lineHeight: 18,
    marginBottom: 10,
  },
  surfSection: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E2D3',
  },
  surfSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  simpleSurfContent: {
    gap: 14,
  },
  simpleSurfTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  simpleSurfTitle: {
    color: '#2F6F86',
    fontSize: 15,
    fontWeight: '800',
  },
  simpleSurfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginVertical: -6,
  },
  simpleSurfMetric: {
    width: '50%',
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  simpleSurfMetricIcon: {
    marginTop: 1,
  },
  simpleSurfMetricBody: {
    flex: 1,
    minWidth: 0,
  },
  simpleSurfLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  simpleSurfValue: {
    color: '#1F4A63',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  simpleSurfHelper: {
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 16,
  },
  simpleSurfWideMetric: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  simpleSurfDivider: {
    height: 1,
    backgroundColor: 'rgba(31,74,99,0.14)',
  },
  simpleSurfBlock: {
    gap: 8,
  },
  simpleSurfBlockTitle: {
    color: '#1F4A63',
    fontSize: 14,
    fontWeight: '900',
  },
  simpleSurfTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  simpleSurfTipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2F6F86',
    marginTop: 7,
  },
  simpleSurfTipText: {
    flex: 1,
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  simpleSurfReportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  simpleSurfReportText: {
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 17,
  },
  simpleSurfReportButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2F6F86',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  simpleSurfReportButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  messageComposer: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E7E2D3',
    borderRadius: 16,
    backgroundColor: '#FBFAF6',
    padding: 10,
  },
  messagesList: {
    maxHeight: 320,
  },
  messagesListContent: {
    paddingBottom: 4,
  },
  postsList: {
    maxHeight: 420,
  },
  postsListContent: {
    paddingBottom: 4,
  },
  messageInput: {
    borderWidth: 0,
    minHeight: 74,
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontSize: 14,
    color: '#1F4A63',
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
  },
  sendButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: '#2F6F86',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  messageCard: {
    borderWidth: 1,
    borderColor: '#E7E2D3',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  authorTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  messageAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8E5D4',
  },
  messageAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F1F4',
  },
  messageAvatarFallbackText: {
    color: '#2F6F86',
    fontSize: 13,
    fontWeight: '800',
  },
  messageAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F4A63',
  },
  messageDate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    color: '#273846',
    lineHeight: 21,
  },
  postCard: {
    borderWidth: 1,
    borderColor: '#E7E2D3',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  postCardFeatured: {
    borderColor: '#8AB7C3',
    backgroundColor: '#F4FAFB',
    shadowColor: '#2F6F86',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  featuredRecordBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  featuredRecordText: {
    color: '#2F6F86',
    fontSize: 12,
    fontWeight: '800',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E5D4',
  },
  postAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F1F4',
  },
  avatarFallbackText: {
    color: '#2F6F86',
    fontSize: 15,
    fontWeight: '800',
  },
  postAuthor: {
    fontSize: 14,
    color: '#1F4A63',
    fontWeight: '700',
  },
  postDate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  recordTypeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E7F1F4',
  },
  recordTypeBadgeText: {
    color: '#2F6F86',
    fontSize: 11,
    fontWeight: '800',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E5D4',
  },
  postImageFrame: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#E8E5D4',
  },
  postDescription: {
    fontSize: 14,
    color: '#273846',
    lineHeight: 21,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#E7E2D3',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionTextLiked: {
    color: '#C54A54',
    fontWeight: '700',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  emptyStateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E7E2D3',
    borderRadius: 14,
    backgroundColor: '#FBFAF6',
    padding: 12,
  },
  relevanceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#F3F1EA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  relevanceHintText: {
    flex: 1,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E7E2D3',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalEyebrow: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F4A63',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F1EA',
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4FAFB',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#8AB7C3',
    borderRadius: 16,
    paddingVertical: 22,
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
    height: 180,
    borderRadius: 16,
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
    backgroundColor: '#FBFAF6',
    borderWidth: 1,
    borderColor: '#E7E2D3',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#1F4A63',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#2F6F86',
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
