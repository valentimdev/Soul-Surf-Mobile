import api from '../api';
import { userService } from '../users/userService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

describe('userService integration (mock data + real HTTP call)', () => {
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

  test('getMyProfile deve consumir GET /api/users/me', async () => {
    const payload = { id: 1, username: 'samuca' };

    server.setRoutes([
      { method: 'GET', path: '/api/users/me', response: { status: 200, body: payload } },
    ]);

    await expect(userService.getMyProfile()).resolves.toEqual(payload);
  });

  test('getUserProfile deve consumir GET /api/users/{id}', async () => {
    const payload = { id: 2, username: 'maria' };

    server.setRoutes([
      { method: 'GET', path: '/api/users/2', response: { status: 200, body: payload } },
    ]);

    await expect(userService.getUserProfile(2)).resolves.toEqual(payload);
  });

  test('toggleFollow deve usar POST quando ainda não segue', async () => {
    const payload = { following: true };

    server.setRoutes([
      { method: 'POST', path: '/api/users/7/follow', response: { status: 200, body: payload } },
    ]);

    await expect(userService.toggleFollow(7, false)).resolves.toEqual(payload);
  });

  test('toggleFollow deve usar DELETE quando já segue', async () => {
    const payload = { following: false };

    server.setRoutes([
      { method: 'DELETE', path: '/api/users/7/follow', response: { status: 200, body: payload } },
    ]);

    await expect(userService.toggleFollow(7, true)).resolves.toEqual(payload);
  });

  test('getFollowers deve consumir GET /api/users/{id}/followers', async () => {
    const payload = [{ id: 2, username: 'maria' }];

    server.setRoutes([
      { method: 'GET', path: '/api/users/7/followers', response: { status: 200, body: payload } },
    ]);

    await expect(userService.getFollowers(7)).resolves.toEqual(payload);
  });

  test('getFollowing deve consumir GET /api/users/{id}/following', async () => {
    const payload = [{ id: 3, username: 'joao' }];

    server.setRoutes([
      { method: 'GET', path: '/api/users/7/following', response: { status: 200, body: payload } },
    ]);

    await expect(userService.getFollowing(7)).resolves.toEqual(payload);
  });

  test('searchUsers deve enviar query na busca', async () => {
    const payload = [{ id: 9, username: 'samuca' }];

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/users/search',
        handler: (request) => {
          expect(request.query).toEqual({ query: 'sam' });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(userService.searchUsers('sam')).resolves.toEqual(payload);
  });

  test('getMentionSuggestions deve enviar query e limit padrão', async () => {
    const payload = [{ id: 5, username: 'carlos' }];

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/users/mention-suggestions',
        handler: (request) => {
          expect(request.query).toEqual({ query: 'ca', limit: '5' });
          return { status: 200, body: payload };
        },
      },
    ]);

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

      server.setRoutes([
        {
          method: 'PUT',
          path: '/api/users/me/upload',
          handler: (request) => {
            expect(String(request.headers['content-type'] || '')).toContain('multipart/form-data');
            return { status: 200, body: payload };
          },
        },
      ]);

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

  test('getMyProfile deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'GET',
        path: '/api/users/me',
        response: { status: 401, body: { message: 'Não autenticado' } },
      },
    ]);

    await expect(userService.getMyProfile()).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});

