import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { userService } from '../users/userService';

describe('userService API integration (HTTP mocked)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.clearAllMocks();
  });

  test('getMyProfile deve consumir GET /api/users/me', async () => {
    const payload = { id: 1, username: 'samuca' };
    mock.onGet('/api/users/me').reply(200, payload);

    await expect(userService.getMyProfile()).resolves.toEqual(payload);
  });

  test('getUserProfile deve consumir GET /api/users/{id}', async () => {
    const payload = { id: 2, username: 'maria' };
    mock.onGet('/api/users/2').reply(200, payload);

    await expect(userService.getUserProfile(2)).resolves.toEqual(payload);
  });

  test('toggleFollow deve usar POST quando ainda não segue', async () => {
    const payload = { following: true };
    mock.onPost('/api/users/7/follow').reply(200, payload);

    await expect(userService.toggleFollow(7, false)).resolves.toEqual(payload);
  });

  test('toggleFollow deve usar DELETE quando já segue', async () => {
    const payload = { following: false };
    mock.onDelete('/api/users/7/follow').reply(200, payload);

    await expect(userService.toggleFollow(7, true)).resolves.toEqual(payload);
  });

  test('getFollowers deve consumir GET /api/users/{id}/followers', async () => {
    const payload = [{ id: 2, username: 'maria' }];
    mock.onGet('/api/users/7/followers').reply(200, payload);

    await expect(userService.getFollowers(7)).resolves.toEqual(payload);
  });

  test('getFollowing deve consumir GET /api/users/{id}/following', async () => {
    const payload = [{ id: 3, username: 'joao' }];
    mock.onGet('/api/users/7/following').reply(200, payload);

    await expect(userService.getFollowing(7)).resolves.toEqual(payload);
  });

  test('searchUsers deve enviar query na busca', async () => {
    const payload = [{ id: 9, username: 'samuca' }];
    mock.onGet('/api/users/search').reply((config) => {
      expect(config.params).toEqual({ query: 'sam' });
      return [200, payload];
    });

    await expect(userService.searchUsers('sam')).resolves.toEqual(payload);
  });

  test('getMentionSuggestions deve enviar query e limit padrão', async () => {
    const payload = [{ id: 5, username: 'carlos' }];
    mock.onGet('/api/users/mention-suggestions').reply((config) => {
      expect(config.params).toEqual({ query: 'ca', limit: 5 });
      return [200, payload];
    });

    await expect(userService.getMentionSuggestions('ca')).resolves.toEqual(payload);
  });

  test('updateProfile deve consumir PUT /api/users/me/upload com multipart/form-data', async () => {
    const originalFormData = global.FormData;
    class MockFormData {
      public fields: Array<[string, unknown]> = [];

      append(key: string, value: unknown) {
        this.fields.push([key, value]);
      }
    }
    (global as any).FormData = MockFormData as any;

    try {
      const payload = { id: 1, username: 'samuca', bio: 'Surf e mar' };

      mock.onPut('/api/users/me/upload').reply((config) => {
        expect(String(config.headers?.['Content-Type'] || config.headers?.['content-type'])).toContain(
          'multipart/form-data'
        );
        return [200, payload];
      });

      await expect(
        userService.updateProfile(
          'Surf e mar',
          'samuca',
          'file:///tmp/perfil.jpg',
          'file:///tmp/capa.jpg'
        )
      ).resolves.toEqual(payload);
    } finally {
      (global as any).FormData = originalFormData;
    }
  });

  test('getMyProfile deve propagar erro HTTP', async () => {
    mock.onGet('/api/users/me').reply(401, { message: 'Não autenticado' });

    await expect(userService.getMyProfile()).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});
