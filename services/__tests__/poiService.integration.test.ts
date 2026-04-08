import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { poiService } from '../beaches/poiService';

describe('POI API integration (HTTP mocked)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
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
        longitude: -38.50,
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

    mock.onGet('/api/pois').reply(200, response);

    await expect(poiService.getAllPois()).resolves.toEqual(response);
  });

  test('deve falhar no consumo de GET /api/pois quando houver erro HTTP', async () => {
    mock.onGet('/api/pois').reply(500, { message: 'Erro interno' });

    await expect(poiService.getAllPois()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  test('deve consumir GET /api/pois/beach/{id}', async () => {
    const response = [{ id: 30, nome: 'Reparo da Praia', categoria: 'BOARD_REPAIR' }];
    mock.onGet('/api/pois/beach/9').reply(200, response);

    await expect(poiService.getPoisByBeach(9)).resolves.toEqual(response);
  });

  test('deve consumir GET /api/pois/category/{category}', async () => {
    const response = [{ id: 10, nome: 'Aula de Surf', categoria: 'SURF_SCHOOL' }];
    mock.onGet('/api/pois/category/SURF_SCHOOL').reply(200, { content: response });

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
          longitude: -38.50,
        },
        {
          id: 2,
          nome: 'Ponto turistico',
          descricao: 'Mirante',
          categoria: 'TOURIST_SPOT',
          latitude: -3.70,
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

    mock.onGet('/api/pois').reply(200, response);

    await expect(poiService.getMapPois()).resolves.toEqual([
      response.content[0],
      response.content[2],
    ]);
  });

  test('deve retornar lista vazia no mapa quando a API de POI falhar', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mock.onGet('/api/pois').reply(503);

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

    mock.onPost('/api/pois').reply((config) => {
      const body = JSON.parse(config.data);
      expect(body).toEqual({
        nome: 'Loja Nova',
        descricao: 'Equipamentos e acessórios',
        categoria: 'SURF_SHOP',
        latitude: -3.7,
        longitude: -38.5,
        telefone: '85999999999',
        caminhoFoto: undefined,
        beach: { id: 1 },
      });
      return [200, created];
    });

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

  test('createPoi deve propagar erro HTTP', async () => {
    mock.onPost('/api/pois').reply(400, { message: 'Praia obrigatória' });

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
