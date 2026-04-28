import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '@/services/users/userService';
import { UserDTO } from '@/types/api';

const LIMIT = 30;
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300';

// ==========================================
// NOVO: Componente isolado para gerenciar o próprio botão
// ==========================================
const UserCardItem = memo(({
  user,
  onToggleFollow
}: {
  user: UserDTO;
  onToggleFollow: (userId: number, wasFollowing: boolean) => Promise<void>
}) => {
  // Estado local para mudança instantânea!
  const [isFollowing, setIsFollowing] = useState(user.following);

  const handlePress = async () => {
    const previousStatus = isFollowing;

    // 1. Atualiza a UI imediatamente antes de chamar a API
    setIsFollowing(!previousStatus);

    try {
      // 2. Chama a função pai que faz o request
      await onToggleFollow(user.id, previousStatus);
    } catch (_error) {
      // 3. Se der erro na API (ex: sem net), desfaz a animação do botão
      setIsFollowing(previousStatus);
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  };

  const displayName = user.username || 'Usuário';
  const avatarUrl = user.fotoPerfil ? user.fotoPerfil : FALLBACK_AVATAR;

  return (
    <View style={styles.userCard}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.userHandle}>@{user.username}</Text>
      </View>
      <TouchableOpacity
        style={[styles.followButton, isFollowing && styles.followingButton]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
          {isFollowing ? 'Seguindo' : 'Seguir'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});
UserCardItem.displayName = 'UserCardItem';

// ==========================================
// TELA PRINCIPAL
// ==========================================
export default function UsersScreen() {
  const router = useRouter();

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = useCallback(async (currentOffset: number, isRefresh = false) => {
    try {
      if (isRefresh) setLoading(true);

      let loggedInUserId = myUserId;
      if (isRefresh && !loggedInUserId) {
        const myProfile = await userService.getMyProfile();
        loggedInUserId = myProfile.id;
        setMyUserId(myProfile.id);
      }

      const data = await userService.getUsers(currentOffset, LIMIT);

      if (data.length < LIMIT) {
        setHasMore(false);
      }

      const filteredData = loggedInUserId
        ? data.filter(user => user.id !== loggedInUserId)
        : data;

      setUsers(prev => isRefresh ? filteredData : [...prev, ...filteredData]);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [myUserId]);

  useEffect(() => {
    fetchUsers(0, true);
  }, [fetchUsers]);

  const handleRefresh = () => {
    setOffset(0);
    setHasMore(true);
    fetchUsers(0, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextOffset = offset + LIMIT;
      setOffset(nextOffset);
      fetchUsers(nextOffset);
    }
  };

  // Esta função agora apenas faz a chamada de rede.
  // O visual é cuidado pelo próprio UserCardItem!
  const handleToggleFollowApi = async (userId: number, wasFollowing: boolean) => {
    await userService.toggleFollow(userId, wasFollowing);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F4A63" />
        </TouchableOpacity>
        <Text style={styles.title}>Descobrir Pessoas</Text>
      </View>

      {loading && offset === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5C9DB8" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          // Renderizando o nosso componente inteligente
          renderItem={({ item }) => (
            <UserCardItem
              user={item}
              onToggleFollow={handleToggleFollowApi}
            />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={loading && offset === 0}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={() => (
            loadingMore ? <ActivityIndicator size="small" color="#5C9DB8" style={{ margin: 20 }} /> : null
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15
  },
  backButton: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1F4A63' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DEC3',
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#E2DEC3' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#1F4A63' },
  userHandle: { fontSize: 13, color: '#5C9DB8', marginTop: 2 },
  followButton: {
    backgroundColor: '#1F4A63',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1F4A63',
  },
  followButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  followingButtonText: { color: '#1F4A63' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { marginTop: 50, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
});