import React from 'react';
import RegisterScreen from '../app/register';
import { authService } from '../services/auth/authService';

const TestRenderer = require('react-test-renderer');
const { act, create } = TestRenderer;

// Mock do react-native seguindo o padrão do map.test.tsx
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
    Image: make('Image'),
  };
});

// Mock do authService
jest.mock('../services/auth/authService', () => ({
  authService: {
    signup: jest.fn(),
  },
}));

// Mock do expo-router (ATUALIZADO: adicionado o 'push' para a tela de termos)
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
    push: jest.fn(),
  },
}));

describe('RegisterScreen', () => {
  // ATUALIZADO: Limpa os rastros de testes anteriores
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar corretamente', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(RegisterScreen));
    });
    expect(tree).toBeDefined();
  });

  it('deve chamar signup ao preencher os campos', async () => {
    (authService.signup as jest.Mock).mockResolvedValue({});
    let tree: any;
    await act(async () => {
      tree = create(React.createElement(RegisterScreen));
    });

    const inputs = tree.root.findAllByType('TextInput');

    await act(async () => {
      inputs[0].props.onChangeText('user');
      inputs[1].props.onChangeText('test@test.com');
      inputs[2].props.onChangeText('pass');
    });

    // ATUALIZADO: Pega a lista de todos os elementos clicáveis
    const touchables = tree.root.findAllByType('TouchableOpacity');

    // O Checkbox é o primeiro [0] e o botão de Cadastrar é o segundo [1]
    const checkbox = touchables[0];
    const buttonCadastrar = touchables[1];

    // ATUALIZADO: Simula o clique no Checkbox para aceitar os termos primeiro
    await act(async () => {
      checkbox.props.onPress();
    });

    // ATUALIZADO: Agora sim simula o clique no botão de Cadastrar e aguarda as promises
    await act(async () => {
      await buttonCadastrar.props.onPress();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(authService.signup).toHaveBeenCalledWith('test@test.com', 'pass', 'user');
  });
});