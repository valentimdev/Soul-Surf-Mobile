import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '../app/(tabs)/notifications';
import { notificationService } from '../services/notifications/notificationService';

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
    {
      id: 2,
      sender: { id: 11, username: 'user2', fotoPerfil: '' },
      type: 'message',
      message: 'enviou uma mensagem',
      read: true,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a lista de notificações corretamente', async () => {
    (notificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    const { getByText, getAllByText } = render(<NotificationsScreen />);

    // Verifica se o título está presente
    expect(getByText('Notificacoes')).toBeTruthy();

    // Aguarda o carregamento das notificações
    await waitFor(() => {
      expect(getByText('user1')).toBeTruthy();
      expect(getByText('avaliou seu post')).toBeTruthy();
      expect(getByText('user2')).toBeTruthy();
      expect(getByText('enviou uma mensagem')).toBeTruthy();
    });
  });

  it('deve exibir mensagem quando não houver notificações', async () => {
    (notificationService.getUserNotifications as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<NotificationsScreen />);

    await waitFor(() => {
      expect(getByText('Nenhuma notificacao no momento.')).toBeTruthy();
    });
  });

  it('deve exibir erro quando a API falhar', async () => {
    (notificationService.getUserNotifications as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { getByText } = render(<NotificationsScreen />);

    await waitFor(() => {
      expect(getByText('Nao foi possivel carregar as notificacoes.')).toBeTruthy();
      expect(getByText('Tentar novamente')).toBeTruthy();
    });
  });
});
