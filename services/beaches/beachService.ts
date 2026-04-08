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
  // Listar Todas as Praias
  getAllBeaches: async (): Promise<BeachDTO[]> => {
    const response = await api.get('/api/beaches');
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.content)) return raw.content;
    return [];
  },

  // Detalhes de uma Praia Específica
  getBeachById: async (beachId: number): Promise<BeachDTO> => {
    const response = await api.get(`/api/beaches/${beachId}`);
    return response.data;
  },

  // Posts associados à Praia
  getBeachPosts: async (beachId: number, page = 0, size = 20): Promise<PostDTO[]> => {
    const response = await api.get(`/api/beaches/${beachId}/posts`, {
      params: { page, size },
    });
    return normalizeList<PostDTO>(response.data);
  },

  // Listar Mensagens do Mural da Praia
  getBeachMessages: async (beachId: number): Promise<BeachMessageDTO[]> => {
    const response = await api.get(`/api/beaches/${beachId}/mensagens`);
    return normalizeList<BeachMessageDTO>(response.data);
  },

  // Postar Mensagem no Mural
  postBeachMessage: async (beachId: number, texto: string): Promise<BeachMessageDTO> => {
    const response = await api.post(`/api/beaches/${beachId}/mensagens`, null, {
        params: { texto }
    });
    return response.data;
  },
};
