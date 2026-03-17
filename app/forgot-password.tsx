import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '../services/api'; // Importando a nossa instância configurada

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRecover = async () => {
    if (!email) {
      Alert.alert('Aviso', 'Por favor, insira o seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);

    try {
      // Faz a requisição para a rota do backend responsável por esqueci a senha
      const response = await api.post('/auth/forgot-password', {
        email: email
      });

      // Em sistemas de recuperação de senha, o status 200 costuma ser retornado
      // mesmo que o e-mail não exista, por questões de segurança.
      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          'Email Enviado',
          'Se o e-mail constar em nossa base de dados, enviaremos as instruções para redefinição de senha.',
          [{ text: 'Voltar ao Login', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      console.error('Erro ao solicitar recuperação:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao tentar enviar a solicitação. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
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
    resizeMode: 'contain', // Ajustado um pequeno typo que estava no seu código original (resizeMod)
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