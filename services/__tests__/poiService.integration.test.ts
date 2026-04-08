import api from '../api';
import { poiService } from '../beaches/poiService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

describe('poiService integration (mock data + real HTTP call)', () => {
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

  test('deve consumir GET /api/pois com sucesso', async () => {
    const response = [
      {
        id: 1,
        nome: 'Escolinha do Mar',
        descricao: 'Aulas para iniciantes',
        categoria: 'SURF_SCHOOL',
        latitude: -3.71,
        longitude: -38.5,
      },
      {
        id: 2,
        nome: 'Loja da Prancha',
        descricao: 'Venda de equipamentos',
        categoria: 'SURF_SHOP',
        latitude: -3.72,
        longitude: -38.51,
      },
    ];

    server.setRoutes([
      { method: 'GET', path: '/api/pois', response: { status: 200, body: response } },
    ]);

    await expect(poiService.getAllPois()).resolves.toEqual(response);
  });

  test('deve falhar no consumo de GET /api/pois quando houver erro HTTP', async () => {
    server.setRoutes([
      { method: 'GET', path: '/api/pois', response: { status: 500, body: { message: 'Erro interno' } } },
    ]);

    await expect(poiService.getAllPois()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  test('deve consumir GET /api/pois/beach/{id}', async () => {
    const response = [{ id: 30, nome: 'Reparo da Praia', categoria: 'BOARD_REPAIR' }];

    server.setRoutes([
      { method: 'GET', path: '/api/pois/beach/9', response: { status: 200, body: response } },
    ]);

    await expect(poiService.getPoisByBeach(9)).resolves.toEqual(response);
  });

  test('deve consumir GET /api/pois/category/{category}', async () => {
    const response = [{ id: 10, nome: 'Aula de Surf', categoria: 'SURF_SCHOOL' }];

    server.setRoutes([
      {
        method: 'GET',
        path: '/api/pois/category/SURF_SCHOOL',
        response: { status: 200, body: { content: response } },
      },
    ]);

    await expect(poiService.getPoisByCategory('SURF_SCHOOL')).resolves.toEqual(response);
  });

  test('deve filtrar apenas categorias exibidas no mapa no cenario de sucesso', async () => {
    const response = {
      content: [
        {
          id: 1,
          nome: 'Escolinha do Mar',
          descricao: 'Aulas para iniciantes',
          categoria: 'SURF_SCHOOL',
          latitude: -3.71,
          longitude: -38.5,
        },
        {
          id: 2,
          nome: 'Ponto turistico',
          descricao: 'Mirante',
          categoria: 'TOURIST_SPOT',
          latitude: -3.7,
          longitude: -38.49,
        },
        {
          id: 3,
          nome: 'Reparo Express',
          descricao: 'Conserto de pranchas',
          categoria: 'BOARD_REPAIR',
          latitude: -3.73,
          longitude: -38.52,
        },
      ],
    };

    server.setRoutes([
      { method: 'GET', path: '/api/pois', response: { status: 200, body: response } },
    ]);

    await expect(poiService.getMapPois()).resolves.toEqual([response.content[0], response.content[2]]);
  });

  test('deve retornar lista vazia no mapa quando a API de POI falhar', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    server.setRoutes([
      { method: 'GET', path: '/api/pois', response: { status: 503, body: { message: 'indisponível' } } },
    ]);

    await expect(poiService.getMapPois()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('deve consumir POST /api/pois ao criar ponto de interesse', async () => {
    const created = {
      id: 99,
      nome: 'Loja Nova',
      descricao: 'Equipamentos e acessórios',
      categoria: 'SURF_SHOP',
      latitude: -3.7,
      longitude: -38.5,
      beach: { id: 1 },
    };

    server.setRoutes([
      {
        method: 'POST',
        path: '/api/pois',
        handler: (request) => {
          expect(request.jsonBody).toEqual({
            nome: 'Loja Nova',
            descricao: 'Equipamentos e acessórios',
            categoria: 'SURF_SHOP',
            latitude: -3.7,
            longitude: -38.5,
            telefone: '85999999999',
            beach: { id: 1 },
          });
          return { status: 200, body: created };
        },
      },
    ]);

    await expect(
      poiService.createPoi({
        nome: 'Loja Nova',
        descricao: 'Equipamentos e acessórios',
        categoria: 'SURF_SHOP',
        latitude: -3.7,
        longitude: -38.5,
        telefone: '85999999999',
        beachId: 1,
      })
    ).resolves.toEqual(created);
  });

  test('createPoi deve propagar erro HTTP real', async () => {
    server.setRoutes([
      { method: 'POST', path: '/api/pois', response: { status: 400, body: { message: 'Praia obrigatória' } } },
    ]);

    await expect(
      poiService.createPoi({
        nome: 'Teste',
        descricao: 'Desc',
        categoria: 'SURF_SHOP',
        latitude: -3.7,
        longitude: -38.5,
        beachId: 0,
      })
    ).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

