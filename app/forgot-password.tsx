import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import api from '../services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRecover = async () => {
    if (!email) {
      Alert.alert('Aviso', 'Por favor, digite seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);

    try {
      // Fazendo a requisição exatamente como o Swagger pede
      const response = await api.post('/auth/forgot-password', {
        email: email
      });

      if (response.status === 200) {
        // Mostra a mensagem de sucesso e já joga o usuário de volta para o Login
        Alert.alert(
          'E-mail Enviado',
          response.data.message || 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.',
          [{ text: 'Voltar ao Login', onPress: () => router.replace('/login') }]
        );
      }
    } catch (error: any) {
      console.error('Erro ao solicitar recuperação:', error.message);

      if (error.response?.status === 400) {
        Alert.alert('Erro', 'Formato de e-mail inválido.');
      } else {
        Alert.alert('Erro', 'Não foi possível solicitar a recuperação. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Remove o cabeçalho padrão gerado pelo Expo Router */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        <Image
          source={require('../assets/images/soulsurf.jpg')}
          style={styles.logo}
        />

        <Text style={styles.title}>Recuperar Senha</Text>
        <Text style={styles.subtitle}>
          Digite seu e-mail abaixo e enviaremos as instruções para redefinir sua senha.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Seu e-mail cadastrado"
          placeholderTextColor="#8C8A80"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleRecover} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Enviar Link</Text>
          )}
        </TouchableOpacity>

        {/* Atualizado para router.replace('/login') para garantir que vá para a tela certa */}
        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backLink}>
          <Text style={styles.linkText}>Lembrou a senha? <Text style={styles.linkTextBold}>Voltar ao Login</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4EB',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 240,
    height: 140,
    resizeMode: 'contain', // Corrigido de resizeMod para resizeMode
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    height: 60,
    backgroundColor: '#E8E5D4',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 25,
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
    marginBottom: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backLink: {
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