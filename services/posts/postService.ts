import { api } from '../api';
import { PageResponse, PostDTO, MessageResponse } from '../../types/api';

export const postService = {
  // Feed Público
  getPublicFeed: async (page = 0, size = 10): Promise<PageResponse<PostDTO>> => {
    const response = await api.get('/api/posts/home', {
      params: { page, size },
    });
    return response.data;
  },

  // Feed "Seguindo" (Requer Token Autenticado)
  getFollowingFeed: async (page = 0, size = 10): Promise<PageResponse<PostDTO>> => {
    const response = await api.get('/api/posts/following', {
      params: { page, size },
    });
    return response.data;
  },

  // Busca de Post Específico
  getPostById: async (postId: number): Promise<PostDTO> => {
    const response = await api.get(`/api/posts/${postId}`);
    return response.data;
  },

  // Dar ou Tirar Like
  toggleLike: async (postId: number): Promise<{ liked: boolean }> => {
    const response = await api.post(`/api/posts/${postId}/likes`);
    return response.data;
  },

  // Verificar se o usuário curtiu o post
  getLikeStatus: async (postId: number): Promise<{ liked: boolean }> => {
    const response = await api.get(`/api/posts/${postId}/likes/status`);
    return response.data;
  },

  // Contagem de likes
  getLikesCount: async (postId: number): Promise<{ count: number }> => {
    const response = await api.get(`/api/posts/${postId}/likes/count`);
    return response.data;
  },

  // Editar Post
  updatePost: async (postId: number, descricao: string): Promise<MessageResponse> => {
    const response = await api.put(`/api/posts/${postId}`, null, {
      params: { descricao }
    });
    return response.data;
  },

  // Excluir Post
  deletePost: async (postId: number): Promise<MessageResponse> => {
    const response = await api.delete(`/api/posts/${postId}`);
    return response.data;
  },

  // Criação de Post com Imagem
  createPost: async (descricao: string, publico: boolean, beachId?: number, fotoUri?: string): Promise<PostDTO> => {
    const formData = new FormData();
    formData.append('descricao', descricao);
    formData.append('publico', publico.toString());
    if (beachId) {
      formData.append('beachId', beachId.toString());
    }

    if (fotoUri) {
        // Formato necessário para o React Native enviar arquivos via FormData
        const filename = fotoUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append('foto', {
            uri: fotoUri,
            name: filename,
            type,
        } as any);
    }

    const response = await api.post('/api/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
