import BottomSheet from '@/components/BottomSheet'; // Importando seu componente customizado
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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Importação necessária para o BottomSheet funcionar corretamente
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const COVER_FALLBACK = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800';
const AVATAR_FALLBACK = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

export default function ProfileScreen() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgKey, setImgKey] = useState(Date.now());

  // Adiciona um timestamp na URL da imagem para forçar o React Native
  // a baixar a versão atualizada em vez de usar o cache.
  const bustCache = (uri?: string) => {
    if (!uri) return undefined;
    const separator = uri.includes('?') ? '&' : '?';
    return `${uri}${separator}t=${imgKey}`;
  };

  // Estados do BottomSheet (Substituindo o Modal)
  const [sheetVisible, setSheetVisible] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<UserDTO[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await userService.getMyProfile();
      setUser(profile);
      setImgKey(Date.now()); // força reload das imagens
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
    // Pequeno delay para limpar os dados após a animação de fechar
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
          <Text style={styles.emptyText}>Nao foi possivel carregar seu perfil.</Text>
          <TouchableOpacity style={styles.editButton} onPress={fetchProfile}>
            <Text style={styles.editButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    // GestureHandlerRootView é obrigatório para o BottomSheet funcionar
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

          <View style={styles.userInfoSection}>
            <Image
              source={{ uri: bustCache(user.fotoPerfil) || AVATAR_FALLBACK }}
              style={styles.avatar}
            />
            <Text style={styles.userName}>{user.username || 'Surfista'}</Text>
            <Text style={styles.bioText}>{user.bio || 'Nenhuma bio definida.'}</Text>

            <TouchableOpacity
              style={styles.editButton}
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
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
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
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          <View style={styles.postsSection}>
            <Text style={styles.sectionTitle}>Meus posts</Text>
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
                              <Image source={{ uri: post.caminhoFoto }} style={styles.postImage} />
                              <View style={styles.postInfo}>
                                <Text style={styles.postDesc} numberOfLines={1}>
                                  {post.descricao}
                                </Text>
                                <Text style={styles.postBeach}>{post.beach?.nome || 'Local desconhecido'}</Text>
                              </View>
                            </TouchableOpacity>
                          ))
                        ) : (
              <Text style={styles.emptyPostsText}>Voce ainda nao fez nenhum post.</Text>
            )}
          </View>
        </ScrollView>

        {/* BOTTOM SHEET COM GESTO DE ARRASTAR (IGUAL AO MAPA) */}
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
                        // Opcional: Navegar para o perfil do usuário clicado
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
  coverImage: { width: '100%', height: 180, position: 'absolute' },
  headerActions: { alignItems: 'flex-end', padding: 20, height: 120 },
  iconBadge: { backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 20 },
  userInfoSection: { alignItems: 'center', marginTop: 10 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#F6F4EB' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1F4A63', marginTop: 10 },
  bioText: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 10, paddingHorizontal: 40 },
  editButton: { paddingHorizontal: 25, paddingVertical: 10, backgroundColor: '#5C9DB8', borderRadius: 20 },
  editButtonText: { color: '#FFF', fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 25, paddingHorizontal: 20 },
  statCard: { alignItems: 'center', minWidth: 80 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#1F4A63' },
  statLabel: { fontSize: 12, color: '#5C9DB8' },
  postsSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F4A63', marginBottom: 15, textAlign: 'center' },
  postCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 10, marginBottom: 10, elevation: 2 },
  postImage: { width: 60, height: 60, borderRadius: 8 },
  postInfo: { marginLeft: 15, justifyContent: 'center', flex: 1 },
  postDesc: { fontSize: 15, fontWeight: '600', color: '#1F4A63' },
  postBeach: { fontSize: 13, color: '#5C9DB8' },
  emptyPostsText: { textAlign: 'center', color: '#999', marginTop: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: '#5C9DB8' },

  // Estilos do BottomSheet Content
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: 450,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F4A63',
  },
  sheetCloseButton: {
    padding: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DEC3',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2DEC3',
  },
  userRowName: {
    fontSize: 16,
    color: '#1F4A63',
    fontWeight: '600',
    marginLeft: 15,
  },
  emptyModalText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
  },
});
