import { postService } from '@/services/posts/postService';
import { userService } from '@/services/users/userService';
import { PostDTO, UserDTO } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const COVER_FALLBACK = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800';
const AVATAR_FALLBACK = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300';

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
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.seguidoresCount || 0}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.seguindoCount || 0}</Text>
            <Text style={styles.statLabel}>Seguindo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Minhas Contribuicoes</Text>
          {posts.length > 0 ? (
            posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <Image source={{ uri: post.caminhoFoto }} style={styles.postImage} />
                <View style={styles.postInfo}>
                  <Text style={styles.postDesc} numberOfLines={1}>
                    {post.descricao}
                  </Text>
                  <Text style={styles.postBeach}>{post.beach?.nome || 'Local desconhecido'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyPostsText}>Voce ainda nao fez nenhum post.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F4EB' },
  container: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F6F4EB',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyText: {
    color: '#5C9DB8',
    textAlign: 'center',
  },
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
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#1F4A63' },
  statLabel: { fontSize: 12, color: '#5C9DB8' },
  postsSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F4A63', marginBottom: 15 },
  postCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
  },
  postImage: { width: 60, height: 60, borderRadius: 8 },
  postInfo: { marginLeft: 15, justifyContent: 'center', flex: 1 },
  postDesc: { fontSize: 15, fontWeight: '600', color: '#1F4A63' },
  postBeach: { fontSize: 13, color: '#5C9DB8' },
  emptyPostsText: { textAlign: 'center', color: '#999', marginTop: 20 },
});
