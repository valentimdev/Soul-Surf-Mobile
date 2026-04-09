/**
 * SMOKE TEST - CONEXAO REAL COM O BACK-END
 * Este teste nao usa mocks e deve ser habilitado explicitamente.
 * Defina RUN_API_SMOKE_TESTS=true para executar.
 */
const runSmoke = process.env.RUN_API_SMOKE_TESTS === 'true';
const describeSmoke = runSmoke ? describe : describe.skip;

describe('API Smoke Test Toggle', () => {
  test('A flag de execucao e avaliada como boolean', () => {
    expect(typeof runSmoke).toBe('boolean');
  });
});

describeSmoke('API Smoke Test (Real Connection)', () => {
  // Aumenta o timeout porque o backend na nuvem pode responder mais lentamente.
  jest.setTimeout(20000);

  test('Deve conseguir listar as praias (GET /api/beaches)', async () => {
    try {
      const { beachService } = await import('../beaches/beachService');
      const beaches = await beachService.getAllBeaches();
      console.log(`Conexao bem-sucedida! Encontradas ${beaches.length} praias.`);
      expect(Array.isArray(beaches)).toBe(true);
    } catch (error: any) {
      console.error('Erro ao conectar no /api/beaches:', error.message);
      throw error;
    }
  });

  test('Deve conseguir carregar o Feed Publico (GET /api/posts/home)', async () => {
    try {
      const { postService } = await import('../posts/postService');
      const feed = await postService.getPublicFeed(0, 5);
      console.log(`Feed carregado! Total de elementos no back-end: ${feed.totalElements}`);
      expect(feed).toHaveProperty('content');
    } catch (error: any) {
      console.error('Erro ao conectar no /api/posts/home:', error.message);
      throw error;
    }
  });

  test('Deve conseguir carregar o Clima (GET /api/weather/current)', async () => {
    try {
      const { weatherService } = await import('../weather/weatherService');
      const weather = await weatherService.getCurrentWeather('Fortaleza,BR');
      console.log(`Clima em ${weather.cityName}: ${weather.temp}C, ${weather.description}`);
      expect(weather).toHaveProperty('temp');
    } catch (error: any) {
      console.error('Erro ao conectar no /api/weather/current:', error.message);
      throw error;
    }
  });
});
