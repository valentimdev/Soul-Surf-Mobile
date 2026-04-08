import { postService } from '@/services/posts/postService';
import { PostDTO } from '@/types/api';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function formatPostDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function FeedCard({ post }: { post: PostDTO }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.userName}>{post.usuario?.username || 'Surfista'}</Text>
        <Text style={styles.postDate}>{formatPostDate(post.data)}</Text>
      </View>

      {post.caminhoFoto ? <Image source={{ uri: post.caminhoFoto }} style={styles.postImage} /> : null}

      <Text style={styles.description}>{post.descricao || 'Sem descricao.'}</Text>
      <Text style={styles.beachName}>{post.beach?.nome || 'Praia nao informada'}</Text>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>{post.likesCount ?? 0} curtidas</Text>
        <Text style={styles.statsText}>{post.commentsCount ?? 0} comentarios</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      setError(null);
      const response = await postService.getPublicFeed(0, 20);
      setPosts(response.content || []);
    } catch (e) {
      console.error('Erro ao carregar feed:', e);
      setError('Nao foi possivel carregar o feed.');
      setPosts([]);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFeed(true)} />}
      >
        <Text style={styles.title}>Feed</Text>

        {loading && posts.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#5C9DB8" />
            <Text style={styles.centerStateText}>Carregando feed...</Text>
          </View>
        ) : error && posts.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadFeed()}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateText}>Nenhuma postagem disponivel.</Text>
          </View>
        ) : (
          posts.map((post) => <FeedCard key={post.id} post={post} />)
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
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F4A63',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2DEC3',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F4A63',
    flex: 1,
  },
  postDate: {
    fontSize: 12,
    color: '#777',
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#E8E5D4',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  beachName: {
    fontSize: 13,
    color: '#5C9DB8',
    fontWeight: '600',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
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
