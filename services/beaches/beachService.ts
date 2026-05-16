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

export interface CreateBeachRequest {
  nome: string;
  descricao: string;
  localizacao: string;
  nivelExperiencia: string;
  latitude: number;
  longitude: number;
  fotoUri?: string;
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

  createBeach: async (payload: CreateBeachRequest): Promise<BeachDTO> => {
    const formData = new FormData();
    formData.append('nome', payload.nome);
    formData.append('descricao', payload.descricao);
    formData.append('localizacao', payload.localizacao);
    formData.append('nivelExperiencia', payload.nivelExperiencia);
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));

    if (payload.fotoUri) {
      const filename = payload.fotoUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
      const safeFilename = filename && filename.length > 0 ? filename : 'beach.jpg';

      formData.append('foto', {
        uri: payload.fotoUri,
        name: safeFilename,
        type,
      } as any);
    }

    const response = await api.post('/api/beaches/', formData, {
      transformRequest: (data, headers) => {
        if (headers) {
          delete (headers as any)['Content-Type'];
          delete (headers as any)['content-type'];
        }
        return data;
      },
    });
    return response.data;
  },
};
