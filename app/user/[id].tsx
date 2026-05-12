import BottomSheet from '@/components/BottomSheet';
import { useAppAlert } from '@/components/AppAlert';
import { chatService } from '@/services/chat/chatService';
import { userService } from '@/services/users/userService';
import { UserDTO, PostDTO } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams, Stack, useFocusEffect} from 'expo-router';
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
const AVATAR_FALLBACK = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

export default function OtherUserProfileScreen() {
  const { showAlert } = useAppAlert();
  const { id } = useLocalSearchParams();
  const userId = Number(id);

  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMe, setIsMe] = useState(false); // Para esconder botoes caso abra o proprio perfil
  const [startingChat, setStartingChat] = useState(false);

  // Estados do BottomSheet
  const [sheetVisible, setSheetVisible] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<UserDTO[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Busca o perfil alvo
      const profile = await userService.getUserProfile(userId);
      setUser(profile);

      // 2. Descobre quem sou eu
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

    // Atualização otimista (UI rápida)
    setIsFollowing(!previousState);
    setUser(prev => prev ? {
      ...prev,
      seguidoresCount: prev.seguidoresCount + (!previousState ? 1 : -1)
    } : prev);

    try {
      await userService.toggleFollow(user.id, previousState);
    } catch (error) {
      console.error('Erro ao alternar follow:', error);
      // Reverte em caso de erro
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
          avatar: user.fotoPerfil || AVATAR_FALLBACK,
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
          <TouchableOpacity style={styles.actionButtonMain} onPress={fetchProfileData}>
            <Text style={styles.actionButtonTextMain}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Pegamos os posts direto do DTO retornado pela API e tipamos explicitamente
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

          <View style={styles.userInfoSection}>
            <Image
              source={{ uri: user.fotoPerfil || AVATAR_FALLBACK }}
              style={styles.avatar}
            />
            <Text style={styles.userName}>{user.username || 'Surfista'}</Text>
            <Text style={styles.bioText}>{user.bio || 'Nenhuma bio definida.'}</Text>

            {/* BOTOES DE AÇÃO (Ocultos se for o meu próprio perfil) */}
            {!isMe && (
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.actionButtonMain, isFollowing && styles.followingButton]}
                  onPress={handleToggleFollow}
                >
                  <Text style={[styles.actionButtonTextMain, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.messageButton, startingChat && { opacity: 0.5 }]}
                  onPress={handleStartChat}
                  disabled={startingChat}
                >
                  {startingChat ? (
                    <ActivityIndicator size="small" color="#5C9DB8" />
                  ) : (
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="#5C9DB8" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => openFollowSheet('followers', user.seguidoresCount)}
            >
              <Text style={styles.statNumber}>{user.seguidoresCount || 0}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => openFollowSheet('following', user.seguindoCount)}
            >
              <Text style={styles.statNumber}>{user.seguindoCount || 0}</Text>
              <Text style={styles.statLabel}>Seguindo</Text>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          <View style={styles.postsSection}>
            <Text style={styles.sectionTitle}>Contribuições</Text>
            {userPosts.length > 0 ? (
              userPosts.map((post: PostDTO) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postCard}
                  onPress={() => {
                    if (post.beach?.id) {
                      router.push({
                        pathname: '/beach/[id]',
                        params: {
                          id: post.beach.id,
                          targetPostId: post.id
                        }
                      });
                    }
                  }}
                >
                  {post.caminhoFoto ? (
                    <Image source={{ uri: post.caminhoFoto }} style={styles.postImage} />
                  ) : (
                    <View style={[styles.postImage, { backgroundColor: '#E2DEC3', alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="image-outline" size={24} color="#999" />
                    </View>
                  )}
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
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyPostsText}>Este surfista ainda não fez posts.</Text>
            )}
          </View>
        </ScrollView>

        <BottomSheet
          visible={sheetVisible}
          onClose={closeSheet}
        >
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
                        // Impede que a pessoa fique abrindo um loop infinito do próprio perfil que já está
                        if (item.id !== userId) {
                            router.push(`/user/${item.id}` as Href);
                        }
                    }}
                  >
                    <Image
                      source={{ uri: item.fotoPerfil || AVATAR_FALLBACK }}
                      style={styles.userAvatar}
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
  coverImage: { width: '100%', height: 180, position: 'absolute' },
  headerActions: { alignItems: 'flex-start', padding: 20, height: 120 },
  iconBadge: { backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 20 },
  userInfoSection: { alignItems: 'center', marginTop: 10 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#F6F4EB' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1F4A63', marginTop: 10 },
  bioText: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 10, paddingHorizontal: 40 },

  actionButtonsContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 5 },
  actionButtonMain: { paddingHorizontal: 30, paddingVertical: 10, backgroundColor: '#1F4A63', borderRadius: 20 },
  actionButtonTextMain: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  followingButton: { backgroundColor: '#E2DEC3', borderWidth: 1, borderColor: '#1F4A63' },
  followingButtonText: { color: '#1F4A63' },
  messageButton: { padding: 8, backgroundColor: '#E2DEC3', borderRadius: 20, borderWidth: 1, borderColor: '#5C9DB8' },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 25, paddingHorizontal: 20 },
  statCard: { alignItems: 'center', minWidth: 80 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#1F4A63' },
  statLabel: { fontSize: 12, color: '#5C9DB8' },
  postsSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F4A63', marginBottom: 15 },
  postCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 10, marginBottom: 10, elevation: 2 },
  postImage: { width: 60, height: 60, borderRadius: 8 },
  postInfo: { marginLeft: 15, justifyContent: 'center', flex: 1 },
  postDesc: { fontSize: 15, fontWeight: '600', color: '#1F4A63' },
  postBeach: { fontSize: 13, color: '#5C9DB8', marginTop: 4 },
  emptyPostsText: { textAlign: 'center', color: '#999', marginTop: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: '#5C9DB8' },

  sheetContent: { paddingHorizontal: 20, paddingBottom: 40, height: 450 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 10 },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F4A63' },
  sheetCloseButton: { padding: 4 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2DEC3' },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2DEC3' },
  userRowName: { fontSize: 16, color: '#1F4A63', fontWeight: '600', marginLeft: 15 },
  emptyModalText: { textAlign: 'center', color: '#999', marginTop: 30 },
});
