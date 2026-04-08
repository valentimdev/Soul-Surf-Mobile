import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { chatService } from '../chat/chatService';

describe('chatService API integration (HTTP mocked)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.clearAllMocks();
  });

  test('getMyConversations deve consumir GET /api/chat/conversations', async () => {
    const payload = [{ id: 'c1', group: false }];
    mock.onGet('/api/chat/conversations').reply(200, payload);

    await expect(chatService.getMyConversations()).resolves.toEqual(payload);
  });

  test('createOrGetDM deve retornar conversationId quando a API mandar objeto', async () => {
    mock.onPost('/api/chat/dm').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ otherUserId: '55' });
      return [200, { conversationId: 'conv-55' }];
    });

    await expect(chatService.createOrGetDM('55')).resolves.toBe('conv-55');
  });

  test('createOrGetDM deve retornar resposta bruta quando API mandar string', async () => {
    mock.onPost('/api/chat/dm').reply(200, 'conv-raw');

    await expect(chatService.createOrGetDM('88')).resolves.toBe('conv-raw');
  });

  test('getMessages deve enviar paginação', async () => {
    const payload = [{ id: 'm1', content: 'O mar ta bom' }];

    mock.onGet('/api/chat/conversations/conv-1/messages').reply((config) => {
      expect(config.params).toEqual({ page: 2, size: 15 });
      return [200, payload];
    });

    await expect(chatService.getMessages('conv-1', 2, 15)).resolves.toEqual(payload);
  });

  test('sendMessage deve consumir POST /api/chat/conversations/{id}/messages', async () => {
    const payload = { id: 'm2', content: 'Partiu surf' };

    mock.onPost('/api/chat/conversations/conv-1/messages').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        content: 'Partiu surf',
        attachmentUrl: 'https://files/image.jpg',
      });
      return [200, payload];
    });

    await expect(
      chatService.sendMessage('conv-1', 'Partiu surf', 'https://files/image.jpg')
    ).resolves.toEqual(payload);
  });

  test('getMyConversations deve propagar erro HTTP', async () => {
    mock.onGet('/api/chat/conversations').reply(500, { message: 'Erro no chat' });

    await expect(chatService.getMyConversations()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});

