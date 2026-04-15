import api from '../api';

interface PageResponse<T> {
  content?: T[];
}

function normalizeList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as PageResponse<T>).content)) {
    return (raw as PageResponse<T>).content as T[];
  }
  return [];
}

export interface ChatMessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
  editedAt?: string;
}

export interface ConversationResponse {
  id: string;
  group: boolean;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl: string;
  lastMessage: {
    senderId: string;
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

export const chatService = {
  // Inbox - Listar conversas ativas
  getMyConversations: async (): Promise<ConversationResponse[]> => {
    const response = await api.get('/api/chat/conversations');
    return normalizeList<ConversationResponse>(response.data);
  },

  // Iniciar ou pegar DM existente com outro usuário
  createOrGetDM: async (otherUserId: string): Promise<string> => {
    const response = await api.post('/api/chat/dm', { otherUserId });
    const data = response.data as unknown;

    if (typeof data === 'string') {
      return data;
    }

    if (data && typeof data === 'object') {
      const payload = data as { conversationId?: string | number; id?: string | number };
      const idCandidate = payload.conversationId ?? payload.id;
      if (idCandidate !== undefined && idCandidate !== null) {
        return String(idCandidate);
      }
    }

    throw new Error('Resposta inesperada ao criar conversa');
  },

  // Pegar mensagens de uma conversa
  getMessages: async (conversationId: string, page = 0, size = 30): Promise<ChatMessageResponse[]> => {
    const response = await api.get(`/api/chat/conversations/${conversationId}/messages`, {
      params: { page, size },
    });
    return normalizeList<ChatMessageResponse>(response.data);
  },

  // Enviar Mensagem (via HTTP, antes do WebSockets)
  sendMessage: async (conversationId: string, content: string, attachmentUrl?: string): Promise<ChatMessageResponse> => {
    const response = await api.post(`/api/chat/conversations/${conversationId}/messages`, {
      content,
      attachmentUrl,
    });
    return response.data;
  },
};
