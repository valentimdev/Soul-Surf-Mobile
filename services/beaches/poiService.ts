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
  beachId: number;
}

export const poiService = {
  // Listar todos os pontos de interesse
  getAllPois: async (): Promise<PointOfInterestDTO[]> => {
    const response = await api.get('/api/pois');
    return response.data;
  },

  // Listar pontos de interesse por praia
  getPoisByBeach: async (beachId: number): Promise<PointOfInterestDTO[]> => {
    const response = await api.get(`/api/pois/beach/${beachId}`);
    return response.data;
  },

  // Listar pontos de interesse por categoria
  getPoisByCategory: async (category: PointOfInterestDTO['categoria']): Promise<PointOfInterestDTO[]> => {
    const response = await api.get(`/api/pois/category/${category}`);
    return response.data;
  },

  // Buscar apenas os POIs exibidos no mapa (SURF_SCHOOL, SURF_SHOP, BOARD_REPAIR) — filtragem local
  getMapPois: async (): Promise<PointOfInterestDTO[]> => {
    const response = await api.get('/api/pois');
    const all: PointOfInterestDTO[] = response.data;
    return all.filter((poi) =>
      ['SURF_SCHOOL', 'SURF_SHOP', 'BOARD_REPAIR'].includes(poi.categoria)
    );
  },

  createPoi: async (payload: CreatePoiRequest): Promise<PointOfInterestDTO> => {
    const response = await api.post('/api/pois', {
      nome: payload.nome,
      descricao: payload.descricao,
      categoria: payload.categoria,
      latitude: payload.latitude,
      longitude: payload.longitude,
      telefone: payload.telefone,
      caminhoFoto: payload.caminhoFoto,
      beach: { id: payload.beachId },
    });
    return response.data;
  },
};
