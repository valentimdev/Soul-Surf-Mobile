import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { beachService } from '../beaches/beachService';

describe('beachService API integration (HTTP mocked)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.clearAllMocks();
  });

  test('getAllBeaches deve aceitar resposta em array', async () => {
    const beaches = [{ id: 1, nome: 'Praia do Futuro' }];
    mock.onGet('/api/beaches').reply(200, beaches);

    await expect(beachService.getAllBeaches()).resolves.toEqual(beaches);
  });

  test('getAllBeaches deve aceitar resposta paginada', async () => {
    const beaches = [{ id: 2, nome: 'Iracema' }];
    mock.onGet('/api/beaches').reply(200, { content: beaches });

    await expect(beachService.getAllBeaches()).resolves.toEqual(beaches);
  });

  test('getBeachById deve consumir GET /api/beaches/{id}', async () => {
    const beach = { id: 7, nome: 'Cumbuco' };
    mock.onGet('/api/beaches/7').reply(200, beach);

    await expect(beachService.getBeachById(7)).resolves.toEqual(beach);
  });

  test('getBeachPosts deve enviar paginação e normalizar content', async () => {
    const posts = [{ id: 10, descricao: 'Session boa' }];

    mock.onGet('/api/beaches/7/posts').reply((config) => {
      expect(config.params).toEqual({ page: 1, size: 5 });
      return [200, { content: posts }];
    });

    await expect(beachService.getBeachPosts(7, 1, 5)).resolves.toEqual(posts);
  });

  test('getBeachMessages deve normalizar resposta paginada', async () => {
    const messages = [{ id: 3, texto: 'Mar subindo' }];
    mock.onGet('/api/beaches/7/mensagens').reply(200, { content: messages });

    await expect(beachService.getBeachMessages(7)).resolves.toEqual(messages);
  });

  test('postBeachMessage deve consumir POST /api/beaches/{id}/mensagens com query texto', async () => {
    const created = { id: 11, texto: 'Crowd tranquilo' };

    mock.onPost('/api/beaches/7/mensagens').reply((config) => {
      expect(config.params).toEqual({ texto: 'Crowd tranquilo' });
      return [201, created];
    });

    await expect(beachService.postBeachMessage(7, 'Crowd tranquilo')).resolves.toEqual(created);
  });

  test('getBeachById deve propagar erro HTTP', async () => {
    mock.onGet('/api/beaches/999').reply(404, { message: 'Praia não encontrada' });

    await expect(beachService.getBeachById(999)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});

