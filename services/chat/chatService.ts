import { api } from '../api';

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
    return response.data;
  },

  // Iniciar ou pegar DM existente com outro usuário
  createOrGetDM: async (otherUserId: string): Promise<string> => {
    // Retorna o conversationId (string) que a API devolve
    const response = await api.post('/api/chat/dm', { otherUserId });
    return response.data.conversationId || response.data;
  },

  // Pegar mensagens de uma conversa
  getMessages: async (conversationId: string, page = 0, size = 30): Promise<ChatMessageResponse[]> => {
    const response = await api.get(`/api/chat/conversations/${conversationId}/messages`, {
      params: { page, size },
    });
    return response.data;
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
