import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../app/register';
import { authService } from '../services/auth/authService';
import { Alert } from 'react-native';

// Mock do react-native para evitar erros de transformação e act()
jest.mock('react-native', () => {
  const React = require('react');
  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    ActivityIndicator: make('ActivityIndicator'),
    Alert: {
      alert: jest.fn(),
    },
    KeyboardAvoidingView: make('KeyboardAvoidingView'),
    Platform: {
      OS: 'android',
      select: (values: any) => values.android || values.default,
    },
    SafeAreaView: make('SafeAreaView'),
    ScrollView: make('ScrollView'),
    StyleSheet: {
      create: (s: any) => s,
    },
    Text: make('Text'),
    TextInput: make('TextInput'),
    TouchableOpacity: make('TouchableOpacity'),
    View: make('View'),
  };
});

// Mock do authService
jest.mock('../services/auth/authService', () => ({
  authService: {
    signup: jest.fn(),
  },
}));

// Mock do expo-router
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: any[]) => mockReplace(...args),
    back: (...args: any[]) => mockBack(...args),
  },
}));

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve validar campos obrigatórios', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<RegisterScreen />);

    const registerButton = getByText('Cadastrar');
    fireEvent.press(registerButton);

    expect(alertSpy).toHaveBeenCalledWith('Aviso', 'Por favor, preencha todos os campos.');
    expect(authService.signup).not.toHaveBeenCalled();
  });

  it('deve mostrar erro quando o e-mail ou usuário já está em uso (400)', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (authService.signup as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { message: 'User already exists' } },
    });

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Usuário'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('E-mail'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'password123');
    fireEvent.press(getByText('Cadastrar'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'O e-mail ou usuário já está em uso.');
    });
  });

  it('deve mostrar erro de conexão para outros erros', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (authService.signup as jest.Mock).mockRejectedValue(new Error('Network Error'));

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Usuário'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('E-mail'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'password123');
    fireEvent.press(getByText('Cadastrar'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro de Conexão', 'Não foi possível conectar ao servidor.');
    });
  });

  it('deve realizar o cadastro com sucesso e redirecionar para login', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (authService.signup as jest.Mock).mockResolvedValue({});

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Usuário'), 'newuser');
    fireEvent.changeText(getByPlaceholderText('E-mail'), 'new@example.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'password123');
    fireEvent.press(getByText('Cadastrar'));

    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalledWith('new@example.com', 'password123', 'newuser');
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Conta criada com sucesso!', expect.any(Array));
    });

    // Simula o clique no botão "Ir para o Login" do Alert
    const successCall = alertSpy.mock.calls.find(call => call[1] === 'Conta criada com sucesso!');
    if (successCall && successCall[2]) {
        const loginOption = successCall[2].find((opt: any) => opt.text === 'Ir para o Login');
        if (loginOption && loginOption.onPress) {
            loginOption.onPress();
            expect(mockReplace).toHaveBeenCalledWith('/');
        }
    }
  });
});
