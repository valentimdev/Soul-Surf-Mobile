import { BeachDTO } from '../../types/api';
import api from '../api';

export interface PointOfInterestDTO {
  id: number;
  nome: string;
  descricao: string;
  categoria: 'SURF_SCHOOL' | 'SWIMMING_SCHOOL' | 'SURF_SHOP' | 'BOARD_REPAIR' | 'TOURIST_SPOT';
  latitude: number;
  longitude: number;
  telefone?: string;
  caminhoFoto?: string;
  beach?: BeachDTO;
}

export interface CreatePoiRequest {
  nome: string;
  descricao: string;
  categoria: PointOfInterestDTO['categoria'];
  latitude: number;
  longitude: number;
  telefone?: string;
  fotoUri?: string;
}

function normalizePoiList(raw: unknown): PointOfInterestDTO[] {
  if (Array.isArray(raw)) return raw as PointOfInterestDTO[];
  if (
    raw
    && typeof raw === 'object'
    && Array.isArray((raw as { content?: PointOfInterestDTO[] }).content)
  ) {
    return (raw as { content: PointOfInterestDTO[] }).content;
  }
  return [];
}

export const poiService = {
  // Listar todos os pontos de interesse
  getAllPois: async (): Promise<PointOfInterestDTO[]> => {
    const response = await api.get('/api/pois');
    return normalizePoiList(response.data);
  },

  // Listar pontos de interesse por praia
  getPoisByBeach: async (beachId: number): Promise<PointOfInterestDTO[]> => {
    const response = await api.get(`/api/pois/beach/${beachId}`);
    return normalizePoiList(response.data);
  },

  // Listar pontos de interesse por categoria
  getPoisByCategory: async (category: PointOfInterestDTO['categoria']): Promise<PointOfInterestDTO[]> => {
    const response = await api.get(`/api/pois/category/${category}`);
    return normalizePoiList(response.data);
  },

  // Buscar apenas os POIs exibidos no mapa (SURF_SCHOOL, SURF_SHOP, BOARD_REPAIR) — filtragem local
  getMapPois: async (): Promise<PointOfInterestDTO[]> => {
    try {
      const response = await api.get('/api/pois');
      const all = normalizePoiList(response.data);

      return all.filter((poi) =>
        ['SURF_SCHOOL', 'SURF_SHOP', 'BOARD_REPAIR'].includes(poi.categoria)
      );
    } catch (error) {
      console.error('Falha ao buscar POIs do mapa. Exibindo apenas picos:', error);
      return [];
    }
  },

  createPoi: async (payload: CreatePoiRequest): Promise<PointOfInterestDTO> => {
    const formData = new FormData();
    formData.append('nome', payload.nome);
    formData.append('descricao', payload.descricao);
    formData.append('categoria', payload.categoria);
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));

    if (payload.telefone) {
      formData.append('telefone', payload.telefone);
    }

    if (payload.fotoUri) {
      const filename = payload.fotoUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
      const safeFilename = filename && filename.length > 0 ? filename : 'poi.jpg';

      formData.append('foto', {
        uri: payload.fotoUri,
        name: safeFilename,
        type,
      } as any);
    }

    const response = await api.post('/api/pois', formData, {
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

