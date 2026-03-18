import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import api from '../../services/api';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error: any) {
      console.error("Erro ao buscar perfil:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#F6F4EB' }}>
        <ActivityIndicator size="large" color="#5C9DB8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Foto de Capa */}
        <Image
          source={{ uri: user?.fotoCapa || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800' }}
          style={styles.coverImage}
        />

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBadge}>
            <Ionicons name="settings-outline" size={24} color="#1F4A63" />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfoSection}>
          <Image
            source={{ uri: user?.fotoPerfil || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.username || 'Surfista'}</Text>
          <Text style={styles.bioText}>{user?.bio || 'Nenhuma bio definida.'}</Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push({
              pathname: '/edit-profile',
              params: {
                currentUsername: user?.username,
                currentBio: user?.bio,
                currentAvatar: user?.fotoPerfil,
                currentCover: user?.fotoCapa
              }
            })}
          >
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Estatísticas do Swagger */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.seguidoresCount || 0}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.seguindoCount || 0}</Text>
            <Text style={styles.statLabel}>Seguindo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.posts?.length || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Lista de Posts Reais */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Minhas Contribuições</Text>
          {user?.posts && user.posts.length > 0 ? (
            user.posts.map((post: any) => (
              <View key={post.id} style={styles.postCard}>
                <Image source={{ uri: post.caminhoFoto }} style={styles.postImage} />
                <View style={styles.postInfo}>
                  <Text style={styles.postDesc} numberOfLines={1}>{post.descricao}</Text>
                  <Text style={styles.postBeach}>{post.beach?.nome || 'Local desconhecido'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Você ainda não fez nenhum post.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F4EB' },
  container: { paddingBottom: 40 },
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
  postCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 10, marginBottom: 10, elevation: 2 },
  postImage: { width: 60, height: 60, borderRadius: 8 },
  postInfo: { marginLeft: 15, justifyContent: 'center' },
  postDesc: { fontSize: 15, fontWeight: '600', color: '#1F4A63' },
  postBeach: { fontSize: 13, color: '#5C9DB8' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 }
});