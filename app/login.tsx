import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/auth/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Aviso', 'Por favor, preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(email, password);

      console.log('Resposta do backend:', response);

      const token = response.token;

      if (token) {
        await SecureStore.setItemAsync('userToken', token);
        console.log('Login efetuado com sucesso! Token salvo.');
        router.replace('/map');
      } else {
        Alert.alert('Erro', 'Autenticação falhou: Token não recebido do servidor.');
      }
    } catch (error: any) {
      console.error('Detalhe do erro no login:', error.response?.data || error.message);

      if (error.message === 'Network Error') {
        Alert.alert('Erro de Rede', 'O servidor não respondeu. Verifique EXPO_PUBLIC_API_URL e o protocolo (http/https) do backend. Se alterou o .env, reinicie o Expo com cache limpo.');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Erro', 'E-mail ou senha incorretos.');
      } else if (error.response?.status === 404) {
        Alert.alert('Erro', 'Rota de login não encontrada no app. Verifique a URL base e o prefixo /api do backend.');
      } else if (error.response?.status === 400) {
        Alert.alert('Erro', 'Formato de dados inválido. Verifique o e-mail digitado.');
      } else {
        Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <Image
          source={require('../assets/images/soulsurf.jpg')}
          style={styles.logo}
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

        <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => router.push('/forgot-password')}>
          <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerLink}>
          <Text style={styles.linkText}>Não tem uma conta? <Text style={styles.linkTextBold}>Cadastre-se</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EB' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  logo: { width: 320, height: 160, resizeMode: 'contain', marginBottom: 50 },
  input: { width: '100%', height: 60, backgroundColor: '#E8E5D4', borderRadius: 16, paddingHorizontal: 20, marginBottom: 16, fontSize: 16, color: '#333333' },
  forgotPasswordContainer: { alignSelf: 'flex-end', marginBottom: 35 },
  forgotPasswordText: { fontSize: 14, color: '#666666' },
  button: { width: '100%', height: 60, backgroundColor: '#5C9DB8', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  registerLink: { marginTop: 10 },
  linkText: { fontSize: 15, color: '#666666' },
  linkTextBold: { color: '#5C9DB8', fontWeight: 'bold' },
});

