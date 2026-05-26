import BottomSheet from '@/components/BottomSheet';
import { useAppAlert } from '@/components/AppAlert';
import { getUserAvatarSource } from '@/constants/defaultImages';
import { chatService } from '@/services/chat/chatService';
import { userService } from '@/services/users/userService';
import { postService } from '@/services/posts/postService';
import { commentService } from '@/services/posts/commentService';
import { UserDTO, PostDTO } from '@/types/api';
import { formatDateTimeWithYear } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const COVER_FALLBACK = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800';
const imagemFallback = require('../../assets/images/registrosemimagem.png');

// Componente isolado para os posts, igual ao do seu perfil
function ProfilePostItem({ post }: { post: PostDTO }) {
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState<number>(post.commentsCount || 0);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      Promise.all([
        postService.getLikesCount(post.id),
        commentService.getPostComments(post.id)
      ])
        .then(([countRes, commentsRes]) => {
          if (mounted) {
            setLikesCount(typeof countRes.count === 'number' ? countRes.count : 0);
            setCommentsCount(commentsRes.length);
          }
        })
        .catch(error => {
          console.error('Erro ao buscar stats do post no perfil:', error);
        });

      return () => { mounted = false; };
    }, [post.id])
  );

  return (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => router.push(`/post/${post.id}` as Href)}
    >
      <Image
        source={post.caminhoFoto ? { uri: post.caminhoFoto } : imagemFallback}
        style={styles.postImage}
      />
      <View style={styles.postInfo}>
        {post.descricao ? (
          <Text style={styles.postDesc} numberOfLines={2}>
            {post.descricao}
          </Text>
        ) : (
          <Text style={[styles.postDesc, { color: '#999', fontStyle: 'italic' }]} numberOfLines={1}>
            Sem descrição
          </Text>
        )}
        <Text style={styles.postBeach}>{post.beach?.nome || 'Local desconhecido'}</Text>
        <Text style={styles.postDate}>{formatDateTimeWithYear(post.data)}</Text>
      </View>

      <View style={styles.postStatsRight}>
        <View style={styles.statBadge}>
          <Ionicons name="heart" size={14} color="#C54A54" />
          <Text style={styles.statBadgeText}>{likesCount}</Text>
        </View>
        <View style={styles.statBadge}>
          <Ionicons name="chatbubble" size={14} color="#6B7280" />
          <Text style={styles.statBadgeText}>{commentsCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function OtherUserProfileScreen() {
  const { showAlert } = useAppAlert();
  const { id } = useLocalSearchParams();
  const userId = Number(id);

  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMe, setIsMe] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<UserDTO[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const profile = await userService.getUserProfile(userId);
      setUser(profile);

      const myProfile = await userService.getMyProfile().catch(() => null);

      if (myProfile && myProfile.id === userId) {
        setIsMe(true);
      } else if (myProfile) {
        setIsMe(false);

        const myFollowing = await userService.getFollowing(myProfile.id).catch(() => []);
        const isCurrentlyFollowing = myFollowing.some(u => u.id === userId);

        setIsFollowing(isCurrentlyFollowing || (profile as any).isFollowing || (profile as any).following || false);
      }
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  const handleToggleFollow = async () => {
    if (!user) return;
    const previousState = isFollowing;

    setIsFollowing(!previousState);
    setUser(prev => prev ? {
      ...prev,
      seguidoresCount: prev.seguidoresCount + (!previousState ? 1 : -1)
    } : prev);

    try {
      await userService.toggleFollow(user.id, previousState);
    } catch (error) {
      console.error('Erro ao alternar follow:', error);
      setIsFollowing(previousState);
      setUser(prev => prev ? {
        ...prev,
        seguidoresCount: prev.seguidoresCount + (previousState ? 1 : -1)
      } : prev);
      showAlert('Erro', 'Não foi possível atualizar. Tente novamente.');
    }
  };

  const handleStartChat = async () => {
    if (!user || startingChat) return;
    setStartingChat(true);
    try {
      const conversationId = await chatService.createOrGetDM(String(user.id));
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conversationId,
          name: user.username,
          avatar: user.fotoPerfil || '',
          otherUserId: String(user.id),
        },
      });
    } catch (err) {
      console.error('Erro ao iniciar chat', err);
      showAlert('Erro', 'Não foi possível abrir a conversa no momento.');
    } finally {
      setStartingChat(false);
    }
  };

  const openFollowSheet = async (type: 'followers' | 'following', count: number) => {
    if (count <= 0 || !user) return;

    setModalType(type);
    setSheetVisible(true);
    setLoadingModal(true);

    try {
      if (type === 'followers') {
        const followers = await userService.getFollowers(user.id);
        setModalUsers(followers);
      } else {
        const followingList = await userService.getFollowing(user.id);
        setModalUsers(followingList);
      }
    } catch (error) {
      console.error(`Erro ao buscar lista de ${type}:`, error);
    } finally {
      setLoadingModal(false);
    }
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setTimeout(() => {
      setModalUsers([]);
      setModalType(null);
    }, 300);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C9DB8" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBack}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1F4A63" />
            </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Não foi possível carregar este perfil.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfileData}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const userPosts: PostDTO[] = (user as any).posts || [];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <Image
            source={{ uri: user.fotoCapa || COVER_FALLBACK }}
            style={styles.coverImage}
          />

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBadge}>
              <Ionicons name="arrow-back" size={24} color="#1F4A63" />
            </TouchableOpacity>
          </View>

          {/* NOVA ESTRUTURA DO CABEÇALHO */}
          <View style={styles.mainProfileSection}>

            <View style={styles.topRow}>
              <Image
                source={getUserAvatarSource(user.fotoPerfil)}
                style={styles.avatarLeft}
                resizeMode="cover" // Forçado para o fallback
              />

              <View style={styles.topRowRight}>

                {/* Linha do Nome + Botões de Ação */}
                <View style={styles.nameRow}>
                  <Text style={styles.userNameLeft} numberOfLines={1}>
                    {user.username || 'Surfista'}
                  </Text>

                  {!isMe && (
                    <>
                      <TouchableOpacity
                        style={[styles.followButtonSmall, isFollowing && styles.followingButtonSmall]}
                        onPress={handleToggleFollow}
                      >
                        <Text style={[styles.followButtonTextSmall, isFollowing && styles.followingButtonTextSmall]}>
                          {isFollowing ? 'Seguindo' : 'Seguir'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.messageButtonSmall}
                        onPress={handleStartChat}
                        disabled={startingChat}
                      >
                        {startingChat ? (
                          <ActivityIndicator size="small" color="#5C9DB8" />
                        ) : (
                          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#5C9DB8" />
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Bolhas menores de status */}
                <View style={styles.statsInlineRow}>
                  <TouchableOpacity
                    style={styles.miniStatBubble}
                    onPress={() => openFollowSheet('followers', user.seguidoresCount)}
                  >
                    <Text style={styles.miniStatNumber}>{user.seguidoresCount || 0}</Text>
                    <Text style={styles.miniStatLabel}>Seguidores</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.miniStatBubble}
                    onPress={() => openFollowSheet('following', user.seguindoCount)}
                  >
                    <Text style={styles.miniStatNumber}>{user.seguindoCount || 0}</Text>
                    <Text style={styles.miniStatLabel}>Seguindo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.bioTextLeft}>{user.bio || 'Nenhuma bio definida.'}</Text>
          </View>

          {/* SEÇÃO DOS POSTS */}
          <View style={styles.contentSection}>
            <View style={styles.registrosHeader}>
              <Text style={styles.registrosCountText}>{userPosts.length} Registros</Text>
            </View>

            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <ProfilePostItem key={post.id} post={post} />
              ))
            ) : (
              <Text style={styles.emptyContentText}>Este surfista ainda não fez registros.</Text>
            )}
          </View>
        </ScrollView>

        <BottomSheet visible={sheetVisible} onClose={closeSheet}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {modalType === 'followers' ? 'Seguidores' : 'Seguindo'}
              </Text>
              <TouchableOpacity onPress={closeSheet} style={styles.sheetCloseButton}>
                <Ionicons name="close" size={24} color="#1F4A63" />
              </TouchableOpacity>
            </View>

            {loadingModal ? (
              <ActivityIndicator size="large" color="#5C9DB8" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={modalUsers}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userRow}
                    onPress={() => {
                      closeSheet();
                      if (item.id !== userId) {
                        router.push(`/user/${item.id}` as Href);
                      }
                    }}
                  >
                    <Image
                      source={getUserAvatarSource(item.fotoPerfil)}
                      style={styles.userAvatar}
                      resizeMode="cover"
                    />
                    <Text style={styles.userRowName}>@{item.username}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyModalText}>Nenhum surfista encontrado.</Text>
                }
              />
            )}
          </View>
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F4EB' },
  container: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', backgroundColor: '#F6F4EB' },
  headerBack: { padding: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2DEC3', alignItems: 'center', justifyContent: 'center' },

  coverImage: { width: '100%', height: 160, position: 'absolute' },

  headerActions: {
    position: 'absolute',
    top: 20,
    left: 20, // Mudou de right para left para o botão de voltar
    zIndex: 10,
  },
  iconBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  mainProfileSection: {
    paddingHorizontal: 20,
    paddingTop: 160,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: -30,
    marginBottom: 16,
  },
  avatarLeft: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#F6F4EB',
    backgroundColor: '#E2DEC3',
  },
  topRowRight: {
    flex: 1,
    marginLeft: 16,
    paddingBottom: 4,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6
  },
  userNameLeft: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F4A63',
    flexShrink: 1,
  },

  // Novos botões compactos para combinar com o layout novo
  followButtonSmall: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followingButtonSmall: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1F4A63',
  },
  followButtonTextSmall: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  followingButtonTextSmall: {
    color: '#1F4A63',
  },
  messageButtonSmall: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5C9DB8',
  },

  statsInlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniStatBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2DEC3',
    gap: 4,
  },
  miniStatNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F4A63',
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C9DB8',
    textTransform: 'uppercase',
  },
  bioTextLeft: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },

  // CONTEÚDO (POSTS)
  contentSection: { paddingHorizontal: 20 },
  registrosHeader: {
    marginBottom: 12,
  },
  registrosCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F4A63',
  },
  emptyContentText: { color: '#999', marginTop: 10 },

  postCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2DEC3',
  },
  postImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#E2DEC3' },
  postInfo: { marginLeft: 12, justifyContent: 'center', flex: 1 },
  postDesc: { fontSize: 14, fontWeight: '600', color: '#1F4A63', marginBottom: 4 },
  postBeach: { fontSize: 12, color: '#5C9DB8' },
  postDate: { fontSize: 11, color: '#777', marginTop: 3 },
  postStatsRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E2DEC3',
    gap: 8,
    minWidth: 50
  },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statBadgeText: { fontSize: 12, color: '#6B7280', fontWeight: '600', minWidth: 16, textAlign: 'right' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: '#5C9DB8' },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#5C9DB8',
    borderRadius: 20,
  },
  retryButtonText: { color: '#FFF', fontWeight: 'bold' },

  sheetContent: { paddingHorizontal: 20, paddingBottom: 40, height: 450 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 10 },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F4A63' },
  sheetCloseButton: { padding: 4 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2DEC3' },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2DEC3' },
  userRowName: { fontSize: 16, color: '#1F4A63', fontWeight: '600', marginLeft: 15 },
  emptyModalText: { textAlign: 'center', color: '#999', marginTop: 30 },
});