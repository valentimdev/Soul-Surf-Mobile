import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { notificationService } from '../notifications/notificationService';

describe('notificationService API integration (HTTP mocked)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.clearAllMocks();
  });

  test('getUserNotifications deve consumir GET /api/notifications/', async () => {
    const payload = [{ id: 1, type: 'LIKE', read: false }];
    mock.onGet('/api/notifications/').reply(200, payload);

    await expect(notificationService.getUserNotifications()).resolves.toEqual(payload);
  });

  test('getUnreadCount deve ler count quando existir', async () => {
    mock.onGet('/api/notifications/count').reply(200, { count: 8 });

    await expect(notificationService.getUnreadCount()).resolves.toBe(8);
  });

  test('getUnreadCount deve retornar 0 quando count não existir', async () => {
    mock.onGet('/api/notifications/count').reply(200, {});

    await expect(notificationService.getUnreadCount()).resolves.toBe(0);
  });

  test('markAsRead deve consumir PUT /api/notifications/{id}/read', async () => {
    const payload = { message: 'ok' };
    mock.onPut('/api/notifications/99/read').reply(200, payload);

    await expect(notificationService.markAsRead(99)).resolves.toEqual(payload);
  });

  test('markAsRead deve propagar erro HTTP', async () => {
    mock.onPut('/api/notifications/77/read').reply(404, { message: 'Não encontrada' });

    await expect(notificationService.markAsRead(77)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});

