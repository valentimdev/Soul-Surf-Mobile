import api from '../api';
import { BeachDTO, PostDTO, PageResponse } from '../../types/api';

export interface BeachMessageDTO {
  id: number;
  texto: string;
  data: string;
  autor: {
    id: number;
    username: string;
    fotoPerfil: string;
    following?: boolean;
  };
  praiaId: number;
}

function normalizeList<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw?.content && Array.isArray(raw.content)) return raw.content;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  return [];
}

export const beachService = {
  getAllBeaches: async (): Promise<BeachDTO[]> => {
    const response = await api.get('/api/beaches');
    return normalizeList<BeachDTO>(response.data);
  },

  getBeachById: async (beachId: number): Promise<BeachDTO> => {
    const response = await api.get(`/api/beaches/${beachId}`);
    return response.data;
  },

  getBeachPostsPublic: async (
    beachId: number,
    page?: number,
    size?: number
  ): Promise<PostDTO[]> => {
    const response = await api.get(`/api/beaches/${beachId}/posts`, {
      headers: {
        Authorization: undefined,
      },
      params: {
        page,
        size,
      },
    });

    return normalizeList<PostDTO>(response.data);
  },

  getMyPosts: async (): Promise<PostDTO[]> => {
    const response = await api.get('/api/posts/me');
    return normalizeList<PostDTO>(response.data);
  },

  getBeachPosts: async (
    beachId: number,
    page?: number,
    size?: number
  ): Promise<PostDTO[]> => {
    const response = await api.get(`/api/beaches/${beachId}/posts`, {
      params: {
        page,
        size,
      },
    });

    return normalizeList<PostDTO>(response.data);
  },

  getBeachMessages: async (beachId: number): Promise<BeachMessageDTO[]> => {
    const response = await api.get(`/api/beaches/${beachId}/mensagens`);
    return normalizeList<BeachMessageDTO>(response.data);
  },

  postBeachMessage: async (beachId: number, texto: string): Promise<BeachMessageDTO> => {
    const response = await api.post(`/api/beaches/${beachId}/mensagens`, null, {
      params: { texto },
    });
    return response.data;
  },
};