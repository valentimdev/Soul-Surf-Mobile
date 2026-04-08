import api from '../api';
import { notificationService } from '../notifications/notificationService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

describe('notificationService integration (mock data + real HTTP call)', () => {
  let server: MockHttpServer;
  const originalBaseUrl = api.defaults.baseURL;

  beforeEach(async () => {
    server = await setupMockHttpServer();
    api.defaults.baseURL = server.baseUrl;
  });

  afterEach(async () => {
    api.defaults.baseURL = originalBaseUrl;
    await server.stop();
    jest.clearAllMocks();
  });

  test('getUserNotifications deve consumir GET /api/notifications/', async () => {
    const payload = [{ id: 1, type: 'LIKE', read: false }];
    server.setRoutes([
      { method: 'GET', path: '/api/notifications/', response: { status: 200, body: payload } },
    ]);

    await expect(notificationService.getUserNotifications()).resolves.toEqual(payload);
  });

  test('getUnreadCount deve ler count quando existir', async () => {
    server.setRoutes([
      { method: 'GET', path: '/api/notifications/count', response: { status: 200, body: { count: 8 } } },
    ]);

    await expect(notificationService.getUnreadCount()).resolves.toBe(8);
  });

  test('getUnreadCount deve retornar 0 quando count não existir', async () => {
    server.setRoutes([
      { method: 'GET', path: '/api/notifications/count', response: { status: 200, body: {} } },
    ]);

    await expect(notificationService.getUnreadCount()).resolves.toBe(0);
  });

  test('markAsRead deve consumir PUT /api/notifications/{id}/read', async () => {
    const payload = { message: 'ok' };
    server.setRoutes([
      { method: 'PUT', path: '/api/notifications/99/read', response: { status: 200, body: payload } },
    ]);

    await expect(notificationService.markAsRead(99)).resolves.toEqual(payload);
  });

  test('markAsRead deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'PUT',
        path: '/api/notifications/77/read',
        response: { status: 404, body: { message: 'Não encontrada' } },
      },
    ]);

    await expect(notificationService.markAsRead(77)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});

