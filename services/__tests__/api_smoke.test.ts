import { postService } from '../posts/postService';
import { beachService } from '../beaches/beachService';
import { weatherService } from '../weather/weatherService';

/**
 * SMOKE TEST - CONEXÃO REAL COM O BACK-END
 * Este teste não usa mocks. Ele tenta bater no IP real 147.15.58.134:8080.
 * Serve apenas para você saber se a "ligação" está funcionando.
 */

describe('API Smoke Test (Real Connection)', () => {
  
  // Aumentar o timeout pois o back-end na nuvem pode demorar a responder na primeira vez
  jest.setTimeout(20000);

  test('Deve conseguir listar as praias (GET /api/beaches)', async () => {
    try {
      const beaches = await beachService.getAllBeaches();
      console.log(`✅ Conexão bem-sucedida! Encontradas ${beaches.length} praias.`);
      expect(Array.isArray(beaches)).toBe(true);
    } catch (error: any) {
      console.error('❌ Erro ao conectar no /api/beaches:', error.message);
      throw error;
    }
  });

  test('Deve conseguir carregar o Feed Público (GET /api/posts/home)', async () => {
    try {
      const feed = await postService.getPublicFeed(0, 5);
      console.log(`✅ Feed carregado! Total de elementos no back-end: ${feed.totalElements}`);
      expect(feed).toHaveProperty('content');
    } catch (error: any) {
      console.error('❌ Erro ao conectar no /api/posts/home:', error.message);
      throw error;
    }
  });

  test('Deve conseguir carregar o Clima (GET /api/weather/current)', async () => {
    try {
      const weather = await weatherService.getCurrentWeather('Fortaleza,BR');
      console.log(`✅ Clima em ${weather.cityName}: ${weather.temp}°C, ${weather.description}`);
      expect(weather).toHaveProperty('temp');
    } catch (error: any) {
      console.error('❌ Erro ao conectar no /api/weather/current:', error.message);
      throw error;
    }
  });

});
