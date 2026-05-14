import api from '../api';
import { CommentDTO, MessageResponse, PageResponse, PostDTO } from '../../types/api';

export type AdminMetricsDTO = {
  totalUsers: number;
  totalAdmins: number;
  totalBannedUsers: number;
  totalPosts: number;
  totalComments: number;
  activeAuthors: number;
};

export type AdminAuditLogDTO = {
  id: number;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: number;
  details?: string | null;
  createdAt: string;
};

export const adminService = {
  getMetrics: async (): Promise<AdminMetricsDTO> => {
    const response = await api.get('/api/admin/metrics');
    return response.data;
  },

  getAudits: async (page = 0, size = 20): Promise<PageResponse<AdminAuditLogDTO>> => {
    const response = await api.get('/api/admin/audits', {
      params: { page, size },
    });
    return response.data;
  },

  getPostById: async (postId: number): Promise<PostDTO> => {
    const response = await api.get(`/api/admin/posts/${postId}`);
    return response.data;
  },

  getPostComments: async (postId: number): Promise<CommentDTO[]> => {
    const response = await api.get(`/api/admin/posts/${postId}/comments`);
    return response.data;
  },

  deletePost: async (postId: number): Promise<MessageResponse> => {
    const response = await api.delete(`/api/admin/posts/${postId}`);
    return response.data;
  },

  deleteComment: async (commentId: number): Promise<MessageResponse> => {
    const response = await api.delete(`/api/admin/comments/${commentId}`);
    return response.data;
  },

  banUser: async (userId: number): Promise<MessageResponse> => {
    const response = await api.post(`/api/admin/users/${userId}/ban`);
    return response.data;
  },

  unbanUser: async (userId: number): Promise<MessageResponse> => {
    const response = await api.post(`/api/admin/users/${userId}/unban`);
    return response.data;
  },

  promoteUser: async (userId: number): Promise<MessageResponse> => {
    const response = await api.post(`/api/admin/users/${userId}/promote`);
    return response.data;
  },

  demoteUser: async (userId: number): Promise<MessageResponse> => {
    const response = await api.post(`/api/admin/users/${userId}/demote`);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<MessageResponse> => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },
};
