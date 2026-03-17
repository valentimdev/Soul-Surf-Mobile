import { api } from '../api';
import { CommentDTO, MessageResponse } from '../../types/api';

export const commentService = {
  // Listar comentários de um post
  getPostComments: async (postId: number): Promise<CommentDTO[]> => {
    const response = await api.get(`/api/posts/${postId}/comments/`);
    return response.data;
  },

  // Adicionar um comentário (ou resposta se parentId for enviado)
  addComment: async (postId: number, texto: string, parentId?: number): Promise<CommentDTO> => {
    const response = await api.post(`/api/posts/${postId}/comments/`, null, {
      params: { 
        texto,
        ...(parentId && { parentId })
      }
    });
    return response.data;
  },

  // Atualizar um comentário
  updateComment: async (postId: number, commentId: number, texto: string): Promise<CommentDTO> => {
    const response = await api.put(`/api/posts/${postId}/comments/${commentId}`, null, {
      params: { texto }
    });
    return response.data;
  },

  // Remover um comentário
  deleteComment: async (postId: number, commentId: number): Promise<MessageResponse> => {
    const response = await api.delete(`/api/posts/${postId}/comments/${commentId}`);
    return response.data;
  },
};
