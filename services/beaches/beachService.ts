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
  };
  praiaId: number;
}

function normalizeList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as PageResponse<T>).content)) {
    return (raw as PageResponse<T>).content;
  }
  return [];
}

export const beachService = {
  getAllBeaches: async (): Promise<BeachDTO[]> => {
    const response = await api.get('/api/beaches');
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.content)) return raw.content;
    return [];
  },

  getBeachById: async (beachId: number): Promise<BeachDTO> => {
    const response = await api.get(`/api/beaches/${beachId}`);
    return response.data;
  },

  getBeachPostsPublic: async (beachId: number): Promise<PostDTO[]> => {
    const bypassCache = new Date().getTime();

    const response = await api.get(
      `/api/beaches/${beachId}/posts?t=${bypassCache}`,
      {
        transformRequest: [(data, headers) => {
          delete headers.Authorization;
          return data;
        }]
      }
    );

    return normalizeList<PostDTO>(response.data);
  },

  getMyPosts: async (): Promise<PostDTO[]> => {
    const response = await api.get('/api/posts/me');
    return normalizeList<PostDTO>(response.data);
  },

  getBeachPosts: async (beachId: number): Promise<PostDTO[]> => {
    const bypassCache = new Date().getTime();

    const response = await api.get(`/api/beaches/${beachId}/posts?t=${bypassCache}`);

    return normalizeList<PostDTO>(response.data);
  },

  getBeachMessages: async (beachId: number): Promise<BeachMessageDTO[]> => {
    const response = await api.get(`/api/beaches/${beachId}/mensagens`);
    return normalizeList<BeachMessageDTO>(response.data);
  },

  postBeachMessage: async (beachId: number, texto: string): Promise<BeachMessageDTO> => {
    const response = await api.post(`/api/beaches/${beachId}/mensagens`, null, {
      params: { texto }
    });
    return response.data;
  },
};