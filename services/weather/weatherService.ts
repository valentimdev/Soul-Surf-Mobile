import api from '../api';

export interface WeatherDTO {
  cityName: string;
  temp: number;
  description: string;
  iconCode: string;
}

export const weatherService = {
  // Pegar o clima atual de uma cidade
  getCurrentWeather: async (city = 'Fortaleza,BR'): Promise<WeatherDTO> => {
    const response = await api.get('/api/weather/current', {
      params: { city }
    });
    return response.data;
  },
};
