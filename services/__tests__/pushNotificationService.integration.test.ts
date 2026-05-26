import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import api from '../api';
import { pushNotificationService } from '../notifications/pushNotificationService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}));

describe('pushNotificationService integration (mock data + real HTTP call)', () => {
  let server: MockHttpServer;
  const originalBaseUrl = api.defaults.baseURL;

  beforeEach(async () => {
    server = await setupMockHttpServer();
    api.defaults.baseURL = server.baseUrl;
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('jwt-token');
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: 'ExpoPushToken[test]',
    });
  });

  afterEach(async () => {
    api.defaults.baseURL = originalBaseUrl;
    await server.stop();
    jest.clearAllMocks();
  });

  test('syncPushTokenWithBackend deve registrar o ExpoPushToken no backend autenticado', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/notifications/device-token',
        response: { status: 200, body: { message: 'Token registrado com sucesso' } },
      },
    ]);

    await expect(pushNotificationService.syncPushTokenWithBackend()).resolves.toBe(
      'ExpoPushToken[test]'
    );

    const request = server.getLastRequest('POST', '/api/notifications/device-token');
    expect(request).toBeDefined();
    expect(request?.headers.authorization).toBe('Bearer jwt-token');
    expect(request?.jsonBody).toEqual({
      token: 'ExpoPushToken[test]',
      platform: expect.stringMatching(/^(android|ios)$/),
    });
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'test-project-id',
    });
  });
});
