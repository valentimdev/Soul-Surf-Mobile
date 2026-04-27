import api from '../api';
import { chatService } from '../chat/chatService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

describe('chatService integration (mock data + real HTTP call)', () => {
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

  test('getMyConversations deve consumir GET /api/chat/conversations', async () => {
    const payload = [{ id: 'c1', group: false }];
    server.setRoutes([
      { method: 'GET', path: '/api/chat/conversations', response: { status: 200, body: payload } },
    ]);

    await expect(chatService.getMyConversations()).resolves.toEqual(payload);
  });

  test('getMyConversations deve aceitar resposta paginada', async () => {
    const payload = [{ id: 'c2', group: false }];
    server.setRoutes([
      {
        method: 'GET',
        path: '/api/chat/conversations',
        response: { status: 200, body: { content: payload } },
      },
    ]);

    await expect(chatService.getMyConversations()).resolves.toEqual(payload);
  });

  test('createOrGetDM deve retornar conversationId quando API mandar objeto', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/chat/dm',
        response: { status: 200, body: { conversationId: 'conv-55' } },
      },
    ]);

    await expect(chatService.createOrGetDM('55')).resolves.toBe('conv-55');

    const request = server.getLastRequest('POST', '/api/chat/dm');
    expect(request?.jsonBody).toEqual({ otherUserId: '55' });
  });

  test('createOrGetDM deve retornar resposta bruta quando API mandar string', async () => {
    server.setRoutes([
      { method: 'POST', path: '/api/chat/dm', response: { status: 200, body: 'conv-raw' } },
    ]);

    await expect(chatService.createOrGetDM('88')).resolves.toBe('conv-raw');
  });

  test('createOrGetDM deve usar campo id quando conversationId nao vier', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/chat/dm',
        response: { status: 200, body: { id: 77 } },
      },
    ]);

    await expect(chatService.createOrGetDM('77')).resolves.toBe('77');
  });

  test('createOrGetDM deve falhar com resposta inesperada', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/chat/dm',
        response: { status: 200, body: { ok: true } },
      },
    ]);

    await expect(chatService.createOrGetDM('11')).rejects.toThrow(
      'Resposta inesperada ao criar conversa'
    );
  });

  test('getMessages deve enviar paginação', async () => {
    const payload = [{ id: 'm1', content: 'O mar ta bom' }];
    server.setRoutes([
      {
        method: 'GET',
        path: '/api/chat/conversations/conv-1/messages',
        handler: (request) => {
          expect(request.query).toEqual({ page: '2', size: '15' });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(chatService.getMessages('conv-1', 2, 15)).resolves.toEqual(payload);
  });

  test('getMessages deve aceitar resposta paginada', async () => {
    const payload = [{ id: 'm9', content: 'Linha perfeita hoje' }];
    server.setRoutes([
      {
        method: 'GET',
        path: '/api/chat/conversations/conv-9/messages',
        response: { status: 200, body: { content: payload } },
      },
    ]);

    await expect(chatService.getMessages('conv-9')).resolves.toEqual(payload);
  });

  test('getMessages deve retornar vazio quando formato da resposta for invalido', async () => {
    server.setRoutes([
      {
        method: 'GET',
        path: '/api/chat/conversations/conv-x/messages',
        response: { status: 200, body: { page: 0, total: 1 } },
      },
    ]);

    await expect(chatService.getMessages('conv-x')).resolves.toEqual([]);
  });

  test('sendMessage deve consumir POST /api/chat/conversations/{id}/messages', async () => {
    const payload = { id: 'm2', content: 'Partiu surf' };
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/chat/conversations/conv-1/messages',
        handler: (request) => {
          expect(request.jsonBody).toEqual({
            content: 'Partiu surf',
            attachmentUrl: 'https://files/image.jpg',
          });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(
      chatService.sendMessage('conv-1', 'Partiu surf', 'https://files/image.jpg')
    ).resolves.toEqual(payload);
  });

  test('getMyConversations deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'GET',
        path: '/api/chat/conversations',
        response: { status: 500, body: { message: 'Erro no chat' } },
      },
    ]);

    await expect(chatService.getMyConversations()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});

