import api from '../api';

export interface NotificationDTO {
    id: number;
    sender: {
        id: number;
        username: string;
        fotoPerfil: string;
    };
    type: string; // ex: 'LIKE', 'COMMENT', 'FOLLOW', etc
    postId?: number;
    commentId?: number;
    read: boolean;
    createdAt: string;
    message: string;
}

export const notificationService = {
  // Pegar todas as notificações
  getUserNotifications: async (): Promise<NotificationDTO[]> => {
    const response = await api.get('/api/notifications/');
    return response.data;
  },

  // Pegar a quantidade de não lidas (Badge Count)
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/api/notifications/count');
    return Number(response.data?.count ?? 0);
  },

  // Marcar 1 notificação como lida
  markAsRead: async (notificationId: number): Promise<any> => {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  },
};
