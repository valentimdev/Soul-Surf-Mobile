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
};
