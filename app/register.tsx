import React, { useState } from 'react';
// 1. O SafeAreaView foi removido da linha abaixo para corrigir o Warning
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
// 2. Importado da biblioteca correta:
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import api from '../services/api';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Aviso', 'Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      // Enviando estritamente os campos mapeados no seu Swagger
      const response = await api.post('/auth/signup', {
        email: email,
        password: password,
        username: username,
      });

      // O Swagger mostra que o sucesso retorna o código 201
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Sucesso', 'Conta criada com sucesso!', [
          { text: 'Ir para o Login', onPress: () => router.replace('/') }
        ]);
      }
    } catch (error: any) {
      console.log('Erro no cadastro:', error.response?.data);

      // O Swagger mostra Erro 400 para e-mail já em uso
      if (error.response?.status === 400) {
        Alert.alert('Erro', 'O e-mail ou usuário já está em uso.');
      } else {
        Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image
          source={require('../assets/images/soulsurf.jpg')}
          style={styles.logo}
        />

        <TextInput
          style={styles.input}
          placeholder="Usuário"
          placeholderTextColor="#8C8A80"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#8C8A80"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#8C8A80"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
          <Text style={styles.linkText}>Já tem uma conta? <Text style={styles.linkTextBold}>Faça Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4EB',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logo: {
    width: 300,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 60,
    backgroundColor: '#E8E5D4',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: '#333333',
  },
  button: {
    width: '100%',
    height: 60,
    backgroundColor: '#5C9DB8',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 10,
  },
  linkText: {
    fontSize: 15,
    color: '#666666',
  },
  linkTextBold: {
    color: '#5C9DB8',
    fontWeight: 'bold',
  }
});