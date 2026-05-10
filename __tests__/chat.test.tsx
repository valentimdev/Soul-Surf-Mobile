import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ChatScreen from '../app/(tabs)/chat';
import { chatService } from '../services/chat/chatService';
import { userService } from '../services/users/userService';

// Mock do react-native
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
  it('deve renderizar a tela de chat', async () => {
    (userService.getMyProfile as jest.Mock).mockResolvedValue({ id: 1 });
    (userService.getFollowing as jest.Mock).mockResolvedValue([]);
    (chatService.getMyConversations as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<ChatScreen />);
    await waitFor(() => {
      expect(getByText('Mensagens')).toBeTruthy();
    });
  });
});
