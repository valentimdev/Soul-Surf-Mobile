import api from '../api';
import { SurfConditionsRequestParams, SurfConditionsResponse } from '@/types/surfConditions';

export const DEFAULT_FORTALEZA_COORDS = {
  lat: -3.7319,
  lon: -38.5267,
};

export const surfConditionsService = {
  getSurfConditions: async (params: SurfConditionsRequestParams): Promise<SurfConditionsResponse> => {
    const response = await api.get('/api/weather/surf-conditions', {
      params: {
        lat: params.lat,
        lon: params.lon,
        beach: params.beach,
      },
    });
    return response.data;
  },
};
