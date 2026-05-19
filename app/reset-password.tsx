import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useAppAlert } from '@/components/AppAlert';
import { authService } from '@/services/auth/authService';

export default function ResetPasswordScreen() {
  const { showAlert } = useAppAlert();
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = useMemo(() => (params.email || '').trim().toLowerCase(), [params.email]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!normalizedEmail || !normalizedCode || !newPassword || !confirmPassword) {
      showAlert('Aviso', 'Preencha todos os campos.');
      return;
    }

    if (!/^\d{6}$/.test(normalizedCode)) {
      showAlert('Aviso', 'O codigo deve ter 6 digitos.');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Aviso', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Aviso', 'As senhas nao conferem.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(normalizedEmail, normalizedCode, newPassword);
      showAlert('Sucesso', response.message || 'Senha atualizada com sucesso.', [
        {
          text: 'Ir para login',
          onPress: () => router.replace('/login'),
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error.response?.data || error.message);
      if (error.response?.status === 400) {
        showAlert('Erro', error.response?.data?.message || 'Codigo invalido ou expirado.');
      } else if (error.response?.status === 429) {
        showAlert('Aviso', 'Muitas tentativas. Tente novamente em alguns minutos.');
      } else {
        showAlert('Erro', 'Nao foi possivel redefinir a senha agora.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Redefinir senha</Text>
            <Text style={styles.subtitle}>
              Digite o codigo recebido no e-mail e crie sua nova senha.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#8C8A80"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Codigo de 6 digitos"
              placeholderTextColor="#8C8A80"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />

            <TextInput
              style={styles.input}
              placeholder="Nova senha"
              placeholderTextColor="#8C8A80"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar nova senha"
              placeholderTextColor="#8C8A80"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Atualizar senha</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backLink}>
              <Text style={styles.linkText}>Voltar ao login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF5E9',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
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
    marginTop: 8,
    marginBottom: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 6,
  },
  linkText: {
    fontSize: 15,
    color: '#5C9DB8',
    fontWeight: 'bold',
  },
});
