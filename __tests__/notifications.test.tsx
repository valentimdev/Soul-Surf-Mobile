import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '../app/(tabs)/notifications';
import { notificationService } from '../services/notifications/notificationService';

// Mock do react-native
jest.mock('react-native', () => {
  const React = require('react');
  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    ActivityIndicator: make('ActivityIndicator'),
    RefreshControl: make('RefreshControl'),
    SafeAreaView: make('SafeAreaView'),
    ScrollView: make('ScrollView'),
    StyleSheet: {
      create: (s: any) => s,
    },
    Text: make('Text'),
    TouchableOpacity: make('TouchableOpacity'),
    View: make('View'),
  };
});

// Mock do notificationService
jest.mock('../services/notifications/notificationService', () => ({
  notificationService: {
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
  },
}));

// Mock do expo-router
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    React.useEffect(callback, []);
  },
}));

// Mock do lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const Icon = (props: any) => React.createElement('Icon', props);
  return {
    Clock: Icon,
    MessageSquare: Icon,
    Star: Icon,
    Waves: Icon,
  };
});

describe('NotificationsScreen', () => {
  const mockNotifications = [
    {
      id: 1,
      sender: { id: 10, username: 'user1', fotoPerfil: '' },
      type: 'review',
      message: 'avaliou seu post',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ];

  it('deve renderizar a lista de notificações', async () => {
    (notificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);
    const { getByText } = render(<NotificationsScreen />);
    await waitFor(() => {
      expect(getByText('Notificacoes')).toBeTruthy();
    });
  });
});
