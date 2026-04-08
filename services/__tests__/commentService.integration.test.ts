import api from '../api';
import { commentService } from '../posts/commentService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

describe('commentService integration (mock data + real HTTP call)', () => {
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

  test('getPostComments deve consumir GET /api/posts/{id}/comments/', async () => {
    const payload = [{ id: 1, texto: 'Top' }];

    server.setRoutes([
      { method: 'GET', path: '/api/posts/10/comments/', response: { status: 200, body: payload } },
    ]);

    await expect(commentService.getPostComments(10)).resolves.toEqual(payload);
  });

  test('addComment deve enviar somente texto quando parentId não for informado', async () => {
    const payload = { id: 2, texto: 'Boa' };

    server.setRoutes([
      {
        method: 'POST',
        path: '/api/posts/10/comments/',
        handler: (request) => {
          expect(request.query).toEqual({ texto: 'Boa' });
          return { status: 201, body: payload };
        },
      },
    ]);

    await expect(commentService.addComment(10, 'Boa')).resolves.toEqual(payload);
  });

  test('addComment deve enviar parentId quando for resposta', async () => {
    const payload = { id: 3, texto: 'Resposta' };

    server.setRoutes([
      {
        method: 'POST',
        path: '/api/posts/10/comments/',
        handler: (request) => {
          expect(request.query).toEqual({ texto: 'Resposta', parentId: '1' });
          return { status: 201, body: payload };
        },
      },
    ]);

    await expect(commentService.addComment(10, 'Resposta', 1)).resolves.toEqual(payload);
  });

  test('updateComment deve consumir PUT /api/posts/{postId}/comments/{commentId}', async () => {
    const payload = { id: 3, texto: 'Editado' };

    server.setRoutes([
      {
        method: 'PUT',
        path: '/api/posts/10/comments/3',
        handler: (request) => {
          expect(request.query).toEqual({ texto: 'Editado' });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(commentService.updateComment(10, 3, 'Editado')).resolves.toEqual(payload);
  });

  test('deleteComment deve consumir DELETE /api/posts/{postId}/comments/{commentId}', async () => {
    const payload = { message: 'Removido' };

    server.setRoutes([
      { method: 'DELETE', path: '/api/posts/10/comments/3', response: { status: 200, body: payload } },
    ]);

    await expect(commentService.deleteComment(10, 3)).resolves.toEqual(payload);
  });

  test('deleteComment deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'DELETE',
        path: '/api/posts/10/comments/999',
        response: { status: 403, body: { message: 'Sem permissão' } },
      },
    ]);

    await expect(commentService.deleteComment(10, 999)).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});

