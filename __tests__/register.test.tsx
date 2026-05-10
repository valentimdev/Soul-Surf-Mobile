import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../app/register';
import { authService } from '../services/auth/authService';

// Replicando o padrão de mock de react-native do map.test.tsx para evitar erros de transformação
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
    const { getByText } = render(<RegisterScreen />);
    const registerButton = getByText('Cadastrar');
    fireEvent.press(registerButton);
    expect(authService.signup).not.toHaveBeenCalled();
  });

  it('deve realizar o cadastro com sucesso', async () => {
    (authService.signup as jest.Mock).mockResolvedValue({});
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Usuário'), 'newuser');
    fireEvent.changeText(getByPlaceholderText('E-mail'), 'new@example.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'password123');
    fireEvent.press(getByText('Cadastrar'));

    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalledWith('new@example.com', 'password123', 'newuser');
    });
  });
});
