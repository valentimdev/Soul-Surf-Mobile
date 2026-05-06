import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router'; // <-- Adicionado useFocusEffect

import { postService } from '@/services/posts/postService';
import { userService } from '@/services/users/userService';
import { beachService } from '@/services/beaches/beachService';
import { PostDTO, UserDTO, BeachDTO } from '@/types/api';

type TabType = 'posts' | 'pessoas' | 'praias';

const FALLBACK_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

// =====================================================================
// COMPONENTE DO POST
// =====================================================================
const DiscoverPostCard = ({
  post,
  isFollowing, // <-- Agora recebe o estado atualizado direto do pai
  isMe,
  onUpdateFollow // <-- Callback para atualizar a tela toda
}: {
  post: PostDTO;
  isFollowing: boolean;
  isMe: boolean;
  onUpdateFollow: (userId: number, isNowFollowing: boolean) => void;
}) => {
  const router = useRouter();
  const [loadingFollow, setLoadingFollow] = useState(false);

  const postImage = post.caminhoFoto;
  const author = post.usuario;
  const authorName = author?.username || 'Surfista';
  const authorAvatar = author?.fotoPerfil || FALLBACK_AVATAR;
  const beachName = post.beach?.nome || null;

  const handleToggleFollow = async () => {
    if (!author?.id || loadingFollow) return;

    const previousState = isFollowing;

    // 1. Atualização Otimista: Avisa a tela principal na mesma hora!
    onUpdateFollow(author.id, !previousState);
    setLoadingFollow(true);

    try {
      await userService.toggleFollow(author.id, previousState);
    } catch (error) {
      console.error('Erro ao alternar follow:', error);
      // 2. Reverte na tela principal se a API falhar
      onUpdateFollow(author.id, previousState);
      Alert.alert('Erro', 'Não foi possível atualizar o status de seguir.');
    } finally {
      setLoadingFollow(false);
    }
  };

  const handlePostClick = () => {
    if (post.beach?.id) {
      router.push(`/beach/${post.beach.id}?scrollToPost=${post.id}`);
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => author?.id && router.push(`/user/${author.id}`)}>
          <Image source={{ uri: authorAvatar }} style={styles.postAvatar} />
        </TouchableOpacity>

        <View style={styles.postHeaderInfo}>
          <TouchableOpacity onPress={() => author?.id && router.push(`/user/${author.id}`)}>
            <Text style={styles.postAuthorName}>{authorName}</Text>
          </TouchableOpacity>
          {beachName && post.beach?.id && (
            <TouchableOpacity onPress={() => router.push(`/beach/${post.beach?.id}`)}>
              <Text style={styles.postBeachName}>{beachName}</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isMe && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleToggleFollow}
            disabled={loadingFollow}
          >
            {loadingFollow ? (
              <ActivityIndicator size="small" color={isFollowing ? "#1F4A63" : "#FFFFFF"} />
            ) : (
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={handlePostClick}>
        {postImage ? (
          <Image source={{ uri: postImage }} style={styles.postImage} resizeMode="cover" />
        ) : null}

        {post.descricao ? (
          <View style={styles.postFooter}>
            <Text style={styles.postDescription}>
              <Text style={styles.postAuthorNameBold}>{authorName} </Text>
              {post.descricao}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

// =====================================================================
// TELA PRINCIPAL
// =====================================================================
export default function DiscoverScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [beaches, setBeaches] = useState<BeachDTO[]>([]);

  const [myId, setMyId] = useState<number | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());

  // Carrega feeds gerais uma vez só
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [feedData, usersData, beachesData] = await Promise.all([
        postService.getPublicFeed(0, 50).catch(() => ({ content: [] })),
        userService.getUsers(0, 30).catch(() => []),
        beachService.getAllBeaches().catch(() => []),
      ]);
      const postsArray = Array.isArray(feedData) ? feedData : (feedData.content || feedData.data || []);
      setPosts(postsArray);
      setUsers(usersData);
      setBeaches(beachesData);
    } catch (error) {
      console.error('Erro ao carregar dados do Descobrir:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // NOVO: Atualiza a lista de seguidos silenciosamente toda vez que a tela ganha foco (ex: volta do perfil)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      userService.getMyProfile().then(myProfile => {
        if (!isActive) return;
        setMyId(myProfile.id);
        return userService.getFollowing(myProfile.id);
      }).then(myFollowing => {
        if (isActive && myFollowing) {
          setFollowedIds(new Set(myFollowing.map(u => u.id)));
        }
      }).catch(() => {
        // Ignora erros silenciosamente se não tiver token etc.
      });

      return () => { isActive = false; };
    }, [])
  );

  // Função que o PostCard usa para atualizar o estado global da tela na mesma hora
  const handleUpdateFollow = useCallback((userId: number, isFollowingNow: boolean) => {
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (isFollowingNow) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const delaySearch = setTimeout(async () => {
        try {
          const result = await userService.searchUsers(searchQuery);
          setUsers(result);
        } catch (error) {
          console.error('Erro ao buscar usuários:', error);
        }
      }, 500);
      return () => clearTimeout(delaySearch);
    } else {
      userService.getUsers(0, 30).then(setUsers).catch(() => {});
    }
  }, [searchQuery]);

  const filteredPosts = useMemo(() => {
    let filtered = posts;
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = posts.filter(
        (p) => p.descricao?.toLowerCase().includes(lowerQuery)
      );
    }
    return [...filtered].sort((a, b) => {
      const aHasPhoto = a.caminhoFoto ? 1 : 0;
      const bHasPhoto = b.caminhoFoto ? 1 : 0;
      return bHasPhoto - aHasPhoto;
    });
  }, [posts, searchQuery]);

  const filteredBeaches = useMemo(() => {
    if (!searchQuery.trim()) return beaches;
    const lowerQuery = searchQuery.toLowerCase();
    return beaches.filter(
      (b: any) => (b.nome || b.name || '').toLowerCase().includes(lowerQuery)
    );
  }, [beaches, searchQuery]);

  const handleClearSearch = () => setSearchQuery('');

  const renderUserItem = ({ item }: { item: UserDTO }) => (
    <TouchableOpacity
      style={styles.userCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/user/${item.id}`)}
    >
      <Image source={{ uri: item.fotoPerfil || FALLBACK_AVATAR }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.username}</Text>
        {item.bio && <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderBeachItem = ({ item }: { item: BeachDTO }) => {
    const beachImage = item.caminhoFoto;
    return (
      <TouchableOpacity
        style={styles.beachCard}
        activeOpacity={0.8}
        onPress={() => router.push(`/beach/${item.id}`)}
      >
        <Text style={styles.beachTitle}>{item.nome || 'Praia Desconhecida'}</Text>
        {beachImage ? (
          <Image source={{ uri: beachImage }} style={styles.beachImage} resizeMode="cover" />
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#5C9DB8" />
        </View>
      );
    }

    let data: any[] = [];
    let renderItem: any;
    let emptyMessage = '';

    if (activeTab === 'posts') {
      data = filteredPosts;
      renderItem = ({ item }: { item: PostDTO }) => (
        <DiscoverPostCard
          post={item}
          isFollowing={followedIds.has(item.usuario?.id || -1)} // <-- Lê sempre da "fonte da verdade"
          isMe={myId === item.usuario?.id}
          onUpdateFollow={handleUpdateFollow} // <-- Passa a função de atualizar
        />
      );
      emptyMessage = 'Nenhum post encontrado.';
    } else if (activeTab === 'pessoas') {
      data = users;
      renderItem = renderUserItem;
      emptyMessage = 'Nenhuma pessoa encontrada.';
    } else if (activeTab === 'praias') {
      data = filteredBeaches;
      renderItem = renderBeachItem;
      emptyMessage = 'Nenhuma praia encontrada.';
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item, index) => (item.id ? String(item.id) : String(index))}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar em todo o app..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabsContainer}>
          {(['posts', 'pessoas', 'praias'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderContent()}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F4EB' },
  container: { flex: 1, paddingTop: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2DEC3', borderRadius: 20, marginHorizontal: 20, paddingHorizontal: 12, height: 40, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1F4A63', height: '100%' },
  clearButton: { padding: 4 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 10 },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E2DEC3', alignItems: 'center' },
  tabButtonActive: { backgroundColor: '#1F4A63' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#1F4A63' },
  tabTextActive: { color: '#FFFFFF' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },

  /* ESTILOS DE POSTS */
  postCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2DEC3', overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2DEC3', marginRight: 12 },
  postHeaderInfo: { flex: 1, justifyContent: 'center' },
  postAuthorName: { fontSize: 15, fontWeight: 'bold', color: '#1F4A63' },
  postBeachName: { fontSize: 12, color: '#5C9DB8', marginTop: 2 },

  /* ESTILOS DO BOTÃO DE SEGUIR NO POST */
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1F4A63',
    borderRadius: 20,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 85,
  },
  followingButton: {
    backgroundColor: '#E2DEC3',
    borderWidth: 1,
    borderColor: '#1F4A63',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: '#1F4A63',
  },

  postImage: { width: '100%', height: 300, backgroundColor: '#f0f0f0' },
  postFooter: { padding: 12 },
  postAuthorNameBold: { fontWeight: 'bold', color: '#1F4A63' },
  postDescription: { fontSize: 14, color: '#333', lineHeight: 20 },

  /* ESTILOS DE PESSOAS */
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2DEC3' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E2DEC3', marginRight: 12 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1F4A63' },
  userBio: { fontSize: 14, color: '#999', marginTop: 2 },

  /* ESTILOS DE PRAIAS */
  beachCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2DEC3', overflow: 'hidden' },
  beachTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F4A63', padding: 16 },
  beachImage: { width: '100%', height: 150, backgroundColor: '#f0f0f0' },

  /* UTILIDADES */
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 15, color: '#999' },
});