import { weatherService } from '../weather/weatherService';

describe('weatherService integration (mock fetch)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test('getCurrentWeather deve consumir Open-Meteo com as coordenadas corretas', async () => {
    const mockResponse = {
      current_weather: {
        temperature: 29,
        windspeed: 15,
        winddirection: 180,
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const payload = {
      temp: 29,
      windSpeed: 15,
      windDirection: 180,
    };

    await expect(weatherService.getCurrentWeather(-3.7380, -38.4490)).resolves.toEqual(payload);
    
    // Verifica se a URL contem latitude e longitude (A conversão em string no JS de -3.7380 fica -3.738)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('latitude=-3.738')
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('longitude=-38.449')
    );
  });

  test('getCurrentWeather deve retornar valores zerados em caso de erro da API (fallback)', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(weatherService.getCurrentWeather(-3.7380, -38.4490)).resolves.toEqual({
      temp: 0,
      windSpeed: 0,
      windDirection: 0,
    });
  });
});
