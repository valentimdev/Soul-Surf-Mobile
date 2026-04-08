import api from '../api';
import { weatherService } from '../weather/weatherService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

describe('weatherService integration (mock data + real HTTP call)', () => {
  let server: MockHttpServer;
  const originalBaseUrl = api.defaults.baseURL;

  beforeEach(async () => {
    server = await setupMockHttpServer();
    api.defaults.baseURL = server.baseUrl;
  });

  afterEach(async () => {
    api.defaults.baseURL = originalBaseUrl;
    await server.stop();
    jest.clearAllMocks();
  });

  test('getCurrentWeather deve consumir GET /api/weather/current com cidade', async () => {
    const payload = {
      cityName: 'Fortaleza',
      temp: 29,
      description: 'céu limpo',
      iconCode: '01d',
    };

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/weather/current',
        handler: (request) => {
          expect(request.query).toEqual({ city: 'Fortaleza,BR' });
          return { status: 200, body: payload };
        },
      },
    ]);

    await expect(weatherService.getCurrentWeather('Fortaleza,BR')).resolves.toEqual(payload);
  });

  test('getCurrentWeather deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'GET',
        path: '/api/weather/current',
        response: { status: 503, body: { message: 'Serviço indisponível' } },
      },
    ]);

    await expect(weatherService.getCurrentWeather()).rejects.toMatchObject({
      response: { status: 503 },
    });
  });
});

