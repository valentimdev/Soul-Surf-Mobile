import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { weatherService } from '../weather/weatherService';

describe('weatherService API integration (HTTP mocked)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.clearAllMocks();
  });

  test('getCurrentWeather deve consumir GET /api/weather/current com cidade', async () => {
    const payload = {
      cityName: 'Fortaleza',
      temp: 29,
      description: 'céu limpo',
      iconCode: '01d',
    };

    mock.onGet('/api/weather/current').reply((config) => {
      expect(config.params).toEqual({ city: 'Fortaleza,BR' });
      return [200, payload];
    });

    await expect(weatherService.getCurrentWeather('Fortaleza,BR')).resolves.toEqual(payload);
  });

  test('getCurrentWeather deve propagar erro HTTP', async () => {
    mock.onGet('/api/weather/current').reply(503, { message: 'Serviço indisponível' });

    await expect(weatherService.getCurrentWeather()).rejects.toMatchObject({
      response: { status: 503 },
    });
  });
});

