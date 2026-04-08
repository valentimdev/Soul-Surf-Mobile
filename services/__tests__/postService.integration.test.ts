import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { postService } from '../posts/postService';

describe('postService API integration (HTTP mocked)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.clearAllMocks();
  });

  test('getPublicFeed deve enviar paginação', async () => {
    const payload = { content: [], totalElements: 0 };
    mock.onGet('/api/posts/home').reply((config) => {
      expect(config.params).toEqual({ page: 1, size: 20 });
      return [200, payload];
    });

    await expect(postService.getPublicFeed(1, 20)).resolves.toEqual(payload);
  });

  test('getFollowingFeed deve enviar paginação', async () => {
    const payload = { content: [{ id: 1 }], totalElements: 1 };
    mock.onGet('/api/posts/following').reply((config) => {
      expect(config.params).toEqual({ page: 2, size: 5 });
      return [200, payload];
    });

    await expect(postService.getFollowingFeed(2, 5)).resolves.toEqual(payload);
  });

  test('getPostById deve consumir GET /api/posts/{id}', async () => {
    const payload = { id: 123, descricao: 'Session' };
    mock.onGet('/api/posts/123').reply(200, payload);

    await expect(postService.getPostById(123)).resolves.toEqual(payload);
  });

  test('getPostsByUserEmail deve enviar query email/page/size', async () => {
    const payload = { content: [{ id: 2 }] };
    mock.onGet('/api/posts/user').reply((config) => {
      expect(config.params).toEqual({
        email: 'teste@soulsurf.com',
        page: 0,
        size: 20,
      });
      return [200, payload];
    });

    await expect(postService.getPostsByUserEmail('teste@soulsurf.com')).resolves.toEqual(payload);
  });

  test('getMyPosts deve enviar paginação', async () => {
    const payload = { content: [{ id: 3 }] };
    mock.onGet('/api/posts/me').reply((config) => {
      expect(config.params).toEqual({ page: 1, size: 10 });
      return [200, payload];
    });

    await expect(postService.getMyPosts(1, 10)).resolves.toEqual(payload);
  });

  test('toggleLike deve consumir POST /api/posts/{id}/likes', async () => {
    const payload = { liked: true };
    mock.onPost('/api/posts/9/likes').reply(200, payload);

    await expect(postService.toggleLike(9)).resolves.toEqual(payload);
  });

  test('getLikeStatus deve consumir GET /api/posts/{id}/likes/status', async () => {
    const payload = { liked: false };
    mock.onGet('/api/posts/9/likes/status').reply(200, payload);

    await expect(postService.getLikeStatus(9)).resolves.toEqual(payload);
  });

  test('getLikesCount deve consumir GET /api/posts/{id}/likes/count', async () => {
    const payload = { count: 14 };
    mock.onGet('/api/posts/9/likes/count').reply(200, payload);

    await expect(postService.getLikesCount(9)).resolves.toEqual(payload);
  });

  test('updatePost deve enviar descricao via params', async () => {
    const payload = { message: 'Atualizado' };
    mock.onPut('/api/posts/15').reply((config) => {
      expect(config.params).toEqual({ descricao: 'Novo texto' });
      return [200, payload];
    });

    await expect(postService.updatePost(15, 'Novo texto')).resolves.toEqual(payload);
  });

  test('deletePost deve consumir DELETE /api/posts/{id}', async () => {
    const payload = { message: 'Excluído' };
    mock.onDelete('/api/posts/15').reply(200, payload);

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

      mock.onPost('/api/posts').reply((config) => {
        expect(String(config.headers?.['Content-Type'] || config.headers?.['content-type'])).toContain(
          'multipart/form-data'
        );
        return [200, payload];
      });

      await expect(postService.createPost('Novo post', true, 1, 'file:///tmp/foto.jpg')).resolves.toEqual(payload);
    } finally {
      (global as any).FormData = originalFormData;
    }
  });

  test('getPublicFeed deve propagar erro HTTP', async () => {
    mock.onGet('/api/posts/home').reply(500, { message: 'Falha interna' });

    await expect(postService.getPublicFeed()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});
