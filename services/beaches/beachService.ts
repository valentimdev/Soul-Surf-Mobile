import { api } from '../api';
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

export const beachService = {
  // Listar Todas as Praias
  getAllBeaches: async (): Promise<BeachDTO[]> => {
    const response = await api.get('/api/beaches');
    return response.data;
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
    return response.data;
  },

  // Listar Mensagens do Mural da Praia
  getBeachMessages: async (beachId: number): Promise<BeachMessageDTO[]> => {
    const response = await api.get(`/api/beaches/${beachId}/mensagens`);
    return response.data;
  },

  // Postar Mensagem no Mural
  postBeachMessage: async (beachId: number, texto: string): Promise<BeachMessageDTO> => {
    const response = await api.post(`/api/beaches/${beachId}/mensagens`, null, {
        params: { texto }
    });
    return response.data;
  },
};
