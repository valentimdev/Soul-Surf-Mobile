import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ChatScreen from '../app/(tabs)/chat';
import { chatService } from '../services/chat/chatService';
import { userService } from '../services/users/userService';

// Mock do react-native para evitar erros de transformação
jest.mock('react-native', () => {
  const React = require('react');
  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    ActivityIndicator: make('ActivityIndicator'),
    Alert: {
      alert: jest.fn(),
    },
    FlatList: make('FlatList'),
    Image: make('Image'),
    SafeAreaView: make('SafeAreaView'),
    StyleSheet: {
      create: (s: any) => s,
    },
    Text: make('Text'),
    TouchableOpacity: make('TouchableOpacity'),
    View: make('View'),
  };
});

// Mock dos services
jest.mock('../services/chat/chatService', () => ({
  chatService: {
    getMyConversations: jest.fn(),
  },
}));

jest.mock('../services/users/userService', () => ({
  userService: {
    getMyProfile: jest.fn(),
    getFollowing: jest.fn(),
  },
}));

// Mock do expo-router
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    React.useEffect(callback, []);
  },
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('ChatScreen', () => {
  const mockMyProfile = { id: 1, username: 'me' };
  const mockConversations = [
    {
      id: 'conv1',
      group: false,
      otherUserId: '2',
      otherUserName: 'John Doe',
      otherUserAvatarUrl: '',
      lastMessage: {
        senderId: '2',
        content: 'Olá, tudo bem?',
        createdAt: new Date().toISOString(),
      },
      unreadCount: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a lista de conversas corretamente', async () => {
    (userService.getMyProfile as jest.Mock).mockResolvedValue(mockMyProfile);
    (userService.getFollowing as jest.Mock).mockResolvedValue([]);
    (chatService.getMyConversations as jest.Mock).mockResolvedValue(mockConversations);

    const { getByText } = render(<ChatScreen />);

    // Verifica o título
    expect(getByText('Mensagens')).toBeTruthy();

    // Aguarda o carregamento das conversas
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Olá, tudo bem?')).toBeTruthy();
    });
  });

  it('deve exibir mensagem quando não houver conversas', async () => {
    (userService.getMyProfile as jest.Mock).mockResolvedValue(mockMyProfile);
    (userService.getFollowing as jest.Mock).mockResolvedValue([]);
    (chatService.getMyConversations as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<ChatScreen />);

    await waitFor(() => {
      expect(getByText('Nenhuma conversa encontrada.')).toBeTruthy();
    });
  });

  it('deve exibir erro quando a API falhar', async () => {
    (userService.getMyProfile as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { getByText } = render(<ChatScreen />);

    await waitFor(() => {
      expect(getByText('Tentar novamente')).toBeTruthy();
    });
  });
});
