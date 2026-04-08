import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { commentService } from '../posts/commentService';

describe('commentService API integration (HTTP mocked)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.clearAllMocks();
  });

  test('getPostComments deve consumir GET /api/posts/{id}/comments/', async () => {
    const payload = [{ id: 1, texto: 'Top' }];
    mock.onGet('/api/posts/10/comments/').reply(200, payload);

    await expect(commentService.getPostComments(10)).resolves.toEqual(payload);
  });

  test('addComment deve enviar somente texto quando parentId não for informado', async () => {
    const payload = { id: 2, texto: 'Boa' };

    mock.onPost('/api/posts/10/comments/').reply((config) => {
      expect(config.params).toEqual({ texto: 'Boa' });
      return [201, payload];
    });

    await expect(commentService.addComment(10, 'Boa')).resolves.toEqual(payload);
  });

  test('addComment deve enviar parentId quando for resposta', async () => {
    const payload = { id: 3, texto: 'Resposta' };

    mock.onPost('/api/posts/10/comments/').reply((config) => {
      expect(config.params).toEqual({ texto: 'Resposta', parentId: 1 });
      return [201, payload];
    });

    await expect(commentService.addComment(10, 'Resposta', 1)).resolves.toEqual(payload);
  });

  test('updateComment deve consumir PUT /api/posts/{postId}/comments/{commentId}', async () => {
    const payload = { id: 3, texto: 'Editado' };

    mock.onPut('/api/posts/10/comments/3').reply((config) => {
      expect(config.params).toEqual({ texto: 'Editado' });
      return [200, payload];
    });

    await expect(commentService.updateComment(10, 3, 'Editado')).resolves.toEqual(payload);
  });

  test('deleteComment deve consumir DELETE /api/posts/{postId}/comments/{commentId}', async () => {
    const payload = { message: 'Removido' };
    mock.onDelete('/api/posts/10/comments/3').reply(200, payload);

    await expect(commentService.deleteComment(10, 3)).resolves.toEqual(payload);
  });

  test('deleteComment deve propagar erro HTTP', async () => {
    mock.onDelete('/api/posts/10/comments/999').reply(403, { message: 'Sem permissão' });

    await expect(commentService.deleteComment(10, 999)).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});

