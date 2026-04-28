import api from '../api';
import { beachService } from '../beaches/beachService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

describe('beachService integration (mock data + real HTTP call)', () => {
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

  test('getAllBeaches deve aceitar resposta em array', async () => {
    const beaches = [{ id: 1, nome: 'Praia do Futuro' }];

    server.setRoutes([
      { method: 'GET', path: '/api/beaches', response: { status: 200, body: beaches } },
    ]);

    await expect(beachService.getAllBeaches()).resolves.toEqual(beaches);
  });

  test('getAllBeaches deve aceitar resposta paginada', async () => {
    const beaches = [{ id: 2, nome: 'Iracema' }];

    server.setRoutes([
      { method: 'GET', path: '/api/beaches', response: { status: 200, body: { content: beaches } } },
    ]);

    await expect(beachService.getAllBeaches()).resolves.toEqual(beaches);
  });

  test('getBeachById deve consumir GET /api/beaches/{id}', async () => {
    const beach = { id: 7, nome: 'Cumbuco' };

    server.setRoutes([
      { method: 'GET', path: '/api/beaches/7', response: { status: 200, body: beach } },
    ]);

    await expect(beachService.getBeachById(7)).resolves.toEqual(beach);
  });

  test('getBeachPosts deve enviar paginação e normalizar content', async () => {
    const posts = [{ id: 10, descricao: 'Session boa' }];

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/beaches/7/posts',
        handler: (request) => {
          // CORREÇÃO: Usando objectContaining para ignorar o parâmetro 't' (timestamp) gerado pelo serviço
          expect(request.query).toEqual(
            expect.objectContaining({ page: '1', size: '5' })
          );
          return { status: 200, body: { content: posts } };
        },
      },
    ]);

    await expect(beachService.getBeachPosts(7, 1, 5)).resolves.toEqual(posts);
  });

  test('getBeachMessages deve normalizar resposta paginada', async () => {
    const messages = [{ id: 3, texto: 'Mar subindo' }];

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/beaches/7/mensagens',
        response: { status: 200, body: { content: messages } },
      },
    ]);

    await expect(beachService.getBeachMessages(7)).resolves.toEqual(messages);
  });

  test('postBeachMessage deve consumir POST /api/beaches/{id}/mensagens com query texto', async () => {
    const created = { id: 11, texto: 'Crowd tranquilo' };

    server.setRoutes([
      {
        method: 'POST',
        path: '/api/beaches/7/mensagens',
        handler: (request) => {
          expect(request.query).toEqual({ texto: 'Crowd tranquilo' });
          return { status: 201, body: created };
        },
      },
    ]);

    await expect(beachService.postBeachMessage(7, 'Crowd tranquilo')).resolves.toEqual(created);
  });

  test('getBeachById deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'GET',
        path: '/api/beaches/999',
        response: { status: 404, body: { message: 'Praia não encontrada' } },
      },
    ]);

    await expect(beachService.getBeachById(999)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});