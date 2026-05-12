import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppAlert } from '@/components/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { showAlert } = useAppAlert();

  const handleLogout = async () => {
      showAlert(
        'Sair',
        'Tem certeza que deseja sair da sua conta?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('Iniciando logout...');

                // 1. Remove o token
                await SecureStore.deleteItemAsync('userToken');
                console.log('Token removido!');

                console.log('Redirecionando para o login...');
                router.replace('/login');

              } catch (error) {
                console.error('Erro ao fazer logout:', error);
                showAlert('Erro', 'Não foi possível sair no momento.');
              }
            }
          }
        ]
      );
    };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F4A63" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DEC3',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F4A63',
  },
  spacer: {
    width: 24, // Substitui o comentário que estava no código anterior
  },
  content: {
    flex: 1,
    padding: 20,
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  logoutButton: {
    width: '100%',
    height: 55,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E74C3C',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
