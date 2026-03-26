import { router } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
export default function LoginScreen() {
  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/soulsurf.jpg')}
          style={styles.logo}
        />

        <TextInput
          style={styles.input}
          placeholder="E-mail ou Usuário"
          placeholderTextColor="#8C8A80"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#8C8A80"
          secureTextEntry
        />

        <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => router.push('/forgot-password')}>
          <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerLink}>
          <Text style={styles.linkText}>Não tem uma conta? <Text style={styles.linkTextBold}>Cadastre-se</Text></Text>
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
    width: 300,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 50,
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 35,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#666666',
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
  registerLink: {
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