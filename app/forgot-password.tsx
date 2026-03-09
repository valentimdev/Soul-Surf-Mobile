import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
  const handleRecover = () => {
    console.log('Link de recuperação enviado');
    router.back();
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
        />

        <TouchableOpacity style={styles.button} onPress={handleRecover}>
          <Text style={styles.buttonText}>Enviar Link</Text>
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
    resizeMod: 'contain',
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