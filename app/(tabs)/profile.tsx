import BottomSheet from '@/components/BottomSheet';
import { postService } from '@/services/posts/postService';
import { userService } from '@/services/users/userService';
import { PostDTO, UserDTO } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const COVER_FALLBACK = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800';
const AVATAR_FALLBACK = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
const imagemFallback = require('../../assets/images/registrosemimagem.png');

export default function ProfileScreen() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgKey, setImgKey] = useState(Date.now());

  const [sheetVisible, setSheetVisible] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<UserDTO[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const bustCache = (uri?: string) => {
    if (!uri) return undefined;
    const separator = uri.includes('?') ? '&' : '?';
    return `${uri}${separator}t=${imgKey}`;
  };

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await userService.getMyProfile();
      setUser(profile);
      setImgKey(Date.now());

      const userPosts = await postService.getMyPosts(0, 20);
      setPosts(userPosts.content || []);

    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error.message);
      setUser(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

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
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Não foi possível carregar seu perfil.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <Image
            source={{ uri: bustCache(user.fotoCapa) || COVER_FALLBACK }}
            style={styles.coverImage}
          />

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBadge}>
              <Ionicons name="settings-outline" size={24} color="#1F4A63" />
            </TouchableOpacity>
          </View>

          {/* NOVA ESTRUTURA DO CABEÇALHO */}
          <View style={styles.mainProfileSection}>

            {/* Linha do Avatar + Nome e Status */}
            <View style={styles.topRow}>
              <Image
                source={{ uri: bustCache(user.fotoPerfil) || AVATAR_FALLBACK }}
                style={styles.avatarLeft}
              />

              <View style={styles.topRowRight}>

                {/* Linha do Nome + Lápis de Edição */}
                <View style={styles.nameRow}>
                  <Text style={styles.userNameLeft} numberOfLines={1}>
                    {user.username || 'Surfista'}
                  </Text>

                  <TouchableOpacity
                    style={styles.editIconButton}
                    onPress={() =>
                      router.push({
                        pathname: '/edit-profile',
                        params: {
                          currentUsername: user.username,
                          currentBio: user.bio,
                          currentAvatar: user.fotoPerfil,
                          currentCover: user.fotoCapa,
                        },
                      })
                    }
                  >
                    <Ionicons name="pencil" size={16} color="#1F4A63" />
                  </TouchableOpacity>
                </View>

                {/* Bolhas menores lado a lado abaixo do nome */}
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

            {/* Bio abaixo de tudo */}
            <Text style={styles.bioTextLeft}>{user.bio || 'Nenhuma bio definida.'}</Text>
          </View>

          {/* SEÇÃO DOS POSTS */}
          <View style={styles.contentSection}>

            {/* Contagem colada no canto esquerdo acima do 1º post */}
            <View style={styles.registrosHeader}>
              <Text style={styles.registrosCountText}>{posts.length} Registros</Text>
            </View>

            {posts.length > 0 ? (
              posts.map((post) => (
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
                  <Image
                    source={post.caminhoFoto ? { uri: post.caminhoFoto } : imagemFallback}
                    style={styles.postImage}
                  />
                  <View style={styles.postInfo}>
                    <Text style={styles.postDesc} numberOfLines={2}>
                      {post.descricao}
                    </Text>
                    <Text style={styles.postBeach}>{post.beach?.nome || 'Local desconhecido'}</Text>
                  </View>

                  <View style={styles.postStatsRight}>
                    <View style={styles.statBadge}>
                      <Ionicons name="heart" size={14} color="#C54A54" />
                      <Text style={styles.statBadgeText}>{post.likesCount || 0}</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Ionicons name="chatbubble" size={14} color="#6B7280" />
                      <Text style={styles.statBadgeText}>{post.commentsCount || 0}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyContentText}>Você ainda não fez nenhum registro.</Text>
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

  coverImage: { width: '100%', height: 160, position: 'absolute' },

  headerActions: {
    position: 'absolute',
    top: 20,
    right: 20,
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

  // Novo estilo em linha para o Nome e o Ícone
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userNameLeft: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F4A63',
    marginRight: 8,
    flexShrink: 1, // Evita quebra de tela se o nome for gigante
  },
  editIconButton: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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