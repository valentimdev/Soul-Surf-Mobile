import React from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const MOCK_CONTRIBUTIONS = [
  {
    id: '1',
    title: 'Praia do Norte',
    type: 'Pico de Surf',
    rating: '4.5',
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Praia do Leste',
    type: 'Pico de Surf',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1515404929826-76fff9fef6fe?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Soul Surf Shop',
    type: 'Loja',
    rating: '5.0',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=200&auto=format&fit=crop',
  },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
                  {/* Altere o onPress para navegar para a nova tela */}
                  <TouchableOpacity onPress={() => router.push('/settings')}>
                    <Ionicons name="settings-outline" size={28} color="#5C9DB8" />
                  </TouchableOpacity>
        </View>

        <View style={styles.userInfoSection}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} // Avatar genérico
            style={styles.avatar}
          />
          <Text style={styles.userName}>Carlos Oliveira</Text>

          <View style={styles.tagsContainer}>
            <Ionicons name="water-outline" size={16} color="#5C9DB8" />
            <Text style={styles.tagText}>Goofy</Text>
            <Text style={styles.tagDot}>•</Text>
            <Text style={styles.tagText}>Nível Intermediário</Text>
          </View>
        </View>

        {/* Cards de Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="location-outline" size={24} color="#5C9DB8" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Picos Mapeados</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={24} color="#5C9DB8" />
            <Text style={styles.statNumber}>48</Text>
            <Text style={styles.statLabel}>Avaliações</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="ribbon-outline" size={24} color="#5C9DB8" />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Conquistas</Text>
          </View>
        </View>

        {/* Seção de Contribuições */}
        <View style={styles.contributionsSection}>
          <Text style={styles.sectionTitle}>Minhas Contribuições</Text>

          {MOCK_CONTRIBUTIONS.map((item) => (
            <View key={item.id} style={styles.contributionCard}>
              <Image source={{ uri: item.image }} style={styles.contributionImage} />
              <View style={styles.contributionInfo}>
                <Text style={styles.contributionTitle}>{item.title}</Text>
                <Text style={styles.contributionType}>{item.type}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#5C9DB8" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Botão Ver Todas */}
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Ver todas as contribuições</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F4EB', // Fundo principal
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'flex-end',
    marginTop: 20,
    marginBottom: 10,
  },
  userInfoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F4A63', // Azul escuro para textos principais
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 14,
    color: '#5C9DB8',
    marginLeft: 4,
  },
  tagDot: {
    fontSize: 14,
    color: '#5C9DB8',
    marginHorizontal: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2DEC3', // Borda sutil moderna
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F4A63',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#5C9DB8',
    textAlign: 'center',
  },
  contributionsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F4A63',
    marginBottom: 15,
  },
  contributionCard: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2DEC3',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  contributionImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 15,
  },
  contributionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contributionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F4A63',
    marginBottom: 4,
  },
  contributionType: {
    fontSize: 14,
    color: '#5C9DB8',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
    fontWeight: '500',
  },
  viewAllButton: {
    marginTop: 10,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#E2DEC3',
    borderRadius: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#1F4A63',
    fontWeight: '500',
  },
});