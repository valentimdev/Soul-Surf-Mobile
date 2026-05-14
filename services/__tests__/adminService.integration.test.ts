import api from '../api';
import { adminService } from '../admin/adminService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

describe('adminService integration (mock data + real HTTP call)', () => {
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

  test('getMetrics deve consumir GET /api/admin/metrics', async () => {
    const payload = {
      totalUsers: 10,
      totalAdmins: 1,
      totalBannedUsers: 2,
      totalPosts: 20,
      totalComments: 30,
      activeAuthors: 4,
    };

    server.setRoutes([
      { method: 'GET', path: '/api/admin/metrics', response: { status: 200, body: payload } },
    ]);

    await expect(adminService.getMetrics()).resolves.toEqual(payload);
  });

  test('getAudits deve enviar paginacao', async () => {
    const payload = { content: [{ id: 1, action: 'BAN_USER' }], totalElements: 1 };

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/admin/audits',
        handler: (request) => {
          expect(request.query).toEqual({ page: '1', size: '12' });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(adminService.getAudits(1, 12)).resolves.toEqual(payload);
  });

  test('moderacao de post deve consumir rotas admin', async () => {
    const post = { id: 42, descricao: 'Post moderado' };
    const response = { message: 'Post removido' };

    server.setRoutes([
      { method: 'GET', path: '/api/admin/posts/42', response: { status: 200, body: post } },
      { method: 'DELETE', path: '/api/admin/posts/42', response: { status: 200, body: response } },
    ]);

    await expect(adminService.getPostById(42)).resolves.toEqual(post);
    await expect(adminService.deletePost(42)).resolves.toEqual(response);
  });

  test('moderacao de comentarios deve consumir rotas admin', async () => {
    const comments = [{ id: 7, texto: 'Comentario' }];
    const response = { message: 'Comentario removido' };

    server.setRoutes([
      { method: 'GET', path: '/api/admin/posts/42/comments', response: { status: 200, body: comments } },
      { method: 'DELETE', path: '/api/admin/comments/7', response: { status: 200, body: response } },
    ]);

    await expect(adminService.getPostComments(42)).resolves.toEqual(comments);
    await expect(adminService.deleteComment(7)).resolves.toEqual(response);
  });

  test('banimento e admin de usuario devem consumir rotas admin', async () => {
    const response = { message: 'ok' };

    server.setRoutes([
      { method: 'POST', path: '/api/admin/users/5/ban', response: { status: 200, body: response } },
      { method: 'POST', path: '/api/admin/users/5/unban', response: { status: 200, body: response } },
      { method: 'POST', path: '/api/admin/users/5/promote', response: { status: 200, body: response } },
      { method: 'POST', path: '/api/admin/users/5/demote', response: { status: 200, body: response } },
    ]);

    await expect(adminService.banUser(5)).resolves.toEqual(response);
    await expect(adminService.unbanUser(5)).resolves.toEqual(response);
    await expect(adminService.promoteUser(5)).resolves.toEqual(response);
    await expect(adminService.demoteUser(5)).resolves.toEqual(response);
  });
});
