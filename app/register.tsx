import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppAlert } from '@/components/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService } from '../services/auth/authService';

export default function RegisterScreen() {
  const { showAlert } = useAppAlert();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameChange = (text: string) => {
    const cleanText = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s/g, '')
      .toLowerCase();

    setUsername(cleanText);
  };

  const handleRegister = async () => {
    if (!username || !email || !password) {
      showAlert('Aviso', 'Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.signup(email, password, username);
      showAlert('Sucesso', 'Conta criada com sucesso!', [
        { text: 'Ir para o Login', onPress: () => router.replace('/') },
      ]);
    } catch (error: any) {
      console.log('Erro no cadastro:', error.response?.data || error.message);

      if (error.response?.status === 400) {
        showAlert('Erro', 'O e-mail ou usuário já está em uso.');
      } else if (error.response?.status === 404) {
        showAlert('Erro', 'Rota de cadastro não encontrada no app. Verifique a URL base e o prefixo /api do backend.');
      } else {
        showAlert('Erro de Conexão', 'Não foi possível conectar ao servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            onChangeText={handleUsernameChange}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4EB',
  },
  flex: {
    flex: 1,
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
  },
});