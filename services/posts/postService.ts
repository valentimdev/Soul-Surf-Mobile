import api from '../api';
import { PageResponse, PostDTO, MessageResponse } from '../../types/api';

export const postService = {
  // Feed Publico
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

  // Busca de Post Especifico
  getPostById: async (postId: number): Promise<PostDTO> => {
    const response = await api.get(`/api/posts/${postId}`);
    return response.data;
  },

  getPostsByUserEmail: async (email: string, page = 0, size = 20): Promise<PageResponse<PostDTO>> => {
    const response = await api.get('/api/posts/user', {
      params: { email, page, size },
    });
    return response.data;
  },

  getMyPosts: async (page = 0, size = 20): Promise<PageResponse<PostDTO>> => {
    const response = await api.get('/api/posts/me', {
      params: { page, size },
    });
    return response.data;
  },

  // Dar ou Tirar Like
  toggleLike: async (postId: number): Promise<{ liked: boolean }> => {
    const response = await api.post(`/api/posts/${postId}/likes`);
    return response.data;
  },

  // Verificar se o usuario curtiu o post
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
      params: { descricao },
    });
    return response.data;
  },

  // Excluir Post
  deletePost: async (postId: number): Promise<MessageResponse> => {
    const response = await api.delete(`/api/posts/${postId}`);
    return response.data;
  },

  // Criacao de Post com Imagem
  createPost: async (descricao: string, publico: boolean, beachId?: number, fotoUri?: string): Promise<PostDTO> => {
    const formData = new FormData();
    formData.append('descricao', descricao);
    formData.append('publico', publico.toString());

    if (beachId) {
      formData.append('beachId', beachId.toString());
    }

    if (fotoUri) {
      const filename = fotoUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1].toLowerCase()}` : 'image';
      const safeFilename = filename && filename.length > 0 ? filename : 'post.jpg';

      formData.append('foto', {
        uri: fotoUri,
        name: safeFilename,
        type,
      } as any);
    }

    const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

    const response = await api.post('/api/posts', formData, isReactNative
      ? {
          // No React Native, deixar o runtime definir o boundary automaticamente.
          transformRequest: (data, headers) => {
            if (headers) {
              delete (headers as any)['Content-Type'];
              delete (headers as any)['content-type'];
            }
            return data;
          },
        }
      : {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

    return response.data;
  },
};
