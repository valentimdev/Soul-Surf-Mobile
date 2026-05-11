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

// Mock do expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

describe('RegisterScreen', () => {
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

    const button = tree.root.findAllByType('TouchableOpacity')[0];

    await act(async () => {
        await button.props.onPress();
    });

    expect(authService.signup).toHaveBeenCalledWith('test@test.com', 'pass', 'user');
  });
});
