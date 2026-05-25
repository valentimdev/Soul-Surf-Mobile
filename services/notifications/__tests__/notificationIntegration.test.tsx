import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationRealtimeService } from '@/services/notifications/notificationRealtimeService';
import { userService } from '@/services/users/userService';
import { useAppAlert } from '@/components/AppAlert';
import * as SecureStore from 'expo-secure-store';

// Mocks
jest.mock('@/services/notifications/notificationService');
jest.mock('@/services/notifications/notificationRealtimeService');
jest.mock('@/services/users/userService');
jest.mock('@/components/AppAlert');
jest.mock('expo-secure-store');
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

describe('NotificationContext Integration', () => {
  const mockShowAlert = jest.fn();
  const mockNotification = {
    id: 1,
    sender: { id: 10, username: 'surfer_joe', fotoPerfil: '' },
    type: 'LIKE',
    message: 'surfer_joe curtiu seu registro',
    read: false,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppAlert as jest.Mock).mockReturnValue({ showAlert: mockShowAlert });
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('fake-token');
    (userService.getMyProfile as jest.Mock).mockResolvedValue({ username: 'testuser' });
    (notificationService.getUnreadCount as jest.Mock).mockResolvedValue(0);
    (notificationService.getUserNotifications as jest.Mock).mockResolvedValue([]);
  });

  it('deve disparar alerta visual ao receber notificação via WebSocket', async () => {
    let capturedOnNotification: (n: any) => void = () => {};

    // Mock do connect para capturar o callback de notificação
    (notificationRealtimeService.connect as jest.Mock).mockImplementation((opts) => {
      capturedOnNotification = opts.onNotification;
      return jest.fn(); // disconnect func
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Espera a inicialização (useEffect)
    await act(async () => {
      await Promise.resolve();
    });

    // Simula o recebimento de uma notificação pelo WebSocket
    await act(async () => {
      capturedOnNotification(mockNotification);
    });

    // Verifica se o alerta foi chamado com os dados corretos
    expect(mockShowAlert).toHaveBeenCalledWith(
      'Nova notificação de surfer_joe',
      'surfer_joe curtiu seu registro'
    );

    // Verifica se o estado de notificações foi atualizado
    expect(result.current.notifications).toContainEqual(mockNotification);
    expect(result.current.unreadCount).toBe(1);
  });

  it('deve atualizar a lista de notificações ao marcar como lida', async () => {
    (notificationService.getUserNotifications as jest.Mock).mockResolvedValue([mockNotification]);
    (notificationService.markAsRead as jest.Mock).mockResolvedValue({});

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await result.current.loadNotifications();
    });

    expect(result.current.unreadCount).toBe(1);

    await act(async () => {
      await result.current.markAsRead(mockNotification.id);
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications[0].read).toBe(true);
    expect(notificationService.markAsRead).toHaveBeenCalledWith(mockNotification.id);
  });
});
