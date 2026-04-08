import api from '../api';
import { postService } from '../posts/postService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

describe('postService integration (mock data + real HTTP call)', () => {
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

  test('getPublicFeed deve enviar paginação', async () => {
    const payload = { content: [], totalElements: 0 };

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/posts/home',
        handler: (request) => {
          expect(request.query).toEqual({ page: '1', size: '20' });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(postService.getPublicFeed(1, 20)).resolves.toEqual(payload);
  });

  test('getFollowingFeed deve enviar paginação', async () => {
    const payload = { content: [{ id: 1 }], totalElements: 1 };

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/posts/following',
        handler: (request) => {
          expect(request.query).toEqual({ page: '2', size: '5' });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(postService.getFollowingFeed(2, 5)).resolves.toEqual(payload);
  });

  test('getPostById deve consumir GET /api/posts/{id}', async () => {
    const payload = { id: 123, descricao: 'Session' };

    server.setRoutes([
      { method: 'GET', path: '/api/posts/123', response: { status: 200, body: payload } },
    ]);

    await expect(postService.getPostById(123)).resolves.toEqual(payload);
  });

  test('getPostsByUserEmail deve enviar query email/page/size', async () => {
    const payload = { content: [{ id: 2 }] };

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/posts/user',
        handler: (request) => {
          expect(request.query).toEqual({
            email: 'teste@soulsurf.com',
            page: '0',
            size: '20',
          });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(postService.getPostsByUserEmail('teste@soulsurf.com')).resolves.toEqual(payload);
  });

  test('getMyPosts deve enviar paginação', async () => {
    const payload = { content: [{ id: 3 }] };

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/posts/me',
        handler: (request) => {
          expect(request.query).toEqual({ page: '1', size: '10' });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(postService.getMyPosts(1, 10)).resolves.toEqual(payload);
  });

  test('toggleLike deve consumir POST /api/posts/{id}/likes', async () => {
    const payload = { liked: true };

    server.setRoutes([
      { method: 'POST', path: '/api/posts/9/likes', response: { status: 200, body: payload } },
    ]);

    await expect(postService.toggleLike(9)).resolves.toEqual(payload);
  });

  test('getLikeStatus deve consumir GET /api/posts/{id}/likes/status', async () => {
    const payload = { liked: false };

    server.setRoutes([
      { method: 'GET', path: '/api/posts/9/likes/status', response: { status: 200, body: payload } },
    ]);

    await expect(postService.getLikeStatus(9)).resolves.toEqual(payload);
  });

  test('getLikesCount deve consumir GET /api/posts/{id}/likes/count', async () => {
    const payload = { count: 14 };

    server.setRoutes([
      { method: 'GET', path: '/api/posts/9/likes/count', response: { status: 200, body: payload } },
    ]);

    await expect(postService.getLikesCount(9)).resolves.toEqual(payload);
  });

  test('updatePost deve enviar descricao via params', async () => {
    const payload = { message: 'Atualizado' };

    server.setRoutes([
      {
        method: 'PUT',
        path: '/api/posts/15',
        handler: (request) => {
          expect(request.query).toEqual({ descricao: 'Novo texto' });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(postService.updatePost(15, 'Novo texto')).resolves.toEqual(payload);
  });

  test('deletePost deve consumir DELETE /api/posts/{id}', async () => {
    const payload = { message: 'Excluído' };

    server.setRoutes([
      { method: 'DELETE', path: '/api/posts/15', response: { status: 200, body: payload } },
    ]);

    await expect(postService.deletePost(15)).resolves.toEqual(payload);
  });

  test('createPost deve consumir POST /api/posts com multipart/form-data', async () => {
    const originalFormData = global.FormData;
    class MockFormData {
      public fields: Array<[string, unknown]> = [];

      append(key: string, value: unknown) {
        this.fields.push([key, value]);
      }
    }
    (global as any).FormData = MockFormData as any;

    try {
      const payload = { id: 99, descricao: 'Novo post' };

      server.setRoutes([
        {
          method: 'POST',
          path: '/api/posts',
          handler: (request) => {
            expect(String(request.headers['content-type'] || '')).toContain('multipart/form-data');
            return { status: 200, body: payload };
          },
        },
      ]);

      await expect(postService.createPost('Novo post', true, 1, 'file:///tmp/foto.jpg')).resolves.toEqual(payload);
    } finally {
      (global as any).FormData = originalFormData;
    }
  });

  test('getPublicFeed deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'GET',
        path: '/api/posts/home',
        response: { status: 500, body: { message: 'Falha interna' } },
      },
    ]);

    await expect(postService.getPublicFeed()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});

