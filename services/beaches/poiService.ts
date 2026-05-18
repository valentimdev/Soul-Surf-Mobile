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
  caminhoFoto?: string;
  beachId?: number;
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
    const requestBody: Record<string, unknown> = {
      nome: payload.nome,
      descricao: payload.descricao,
      categoria: payload.categoria,
      latitude: payload.latitude,
      longitude: payload.longitude,
      telefone: payload.telefone,
      caminhoFoto: payload.caminhoFoto,
    };

    if (payload.beachId) {
      requestBody.beach = { id: payload.beachId };
    }

    const response = await api.post('/api/pois', requestBody);
    return response.data;
  },
};
