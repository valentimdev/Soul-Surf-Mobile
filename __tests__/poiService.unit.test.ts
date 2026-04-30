import { poiService } from '@/services/beaches/poiService';
import api from '@/services/api';

// Mock do módulo api
jest.mock('@/services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('poiService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve buscar todos os POIs e normalizar a lista', async () => {
    const mockPois = [{ id: 1, nome: 'Surf Shop X', categoria: 'SURF_SHOP' }];
    (api.get as jest.Mock).mockResolvedValue({ data: mockPois });

    const result = await poiService.getAllPois();

    expect(api.get).toHaveBeenCalledWith('/api/pois');
    expect(result).toEqual(mockPois);
  });

  it('deve buscar POIs por praia', async () => {
    const mockPois = [{ id: 2, nome: 'Escola de Surf Y', categoria: 'SURF_SCHOOL' }];
    (api.get as jest.Mock).mockResolvedValue({ data: mockPois });

    const result = await poiService.getPoisByBeach(1);

    expect(api.get).toHaveBeenCalledWith('/api/pois/beach/1');
    expect(result).toEqual(mockPois);
  });

  it('deve filtrar POIs do mapa localmente', async () => {
    const allPois = [
      { id: 1, nome: 'Shop', categoria: 'SURF_SHOP' },
      { id: 2, nome: 'Tourist', categoria: 'TOURIST_SPOT' },
      { id: 3, nome: 'School', categoria: 'SURF_SCHOOL' },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: allPois });

    const result = await poiService.getMapPois();

    // Deve conter apenas Shop e School
    expect(result.length).toBe(2);
    expect(result.some(p => p.categoria === 'TOURIST_SPOT')).toBe(false);
  });

  it('deve criar um POI corretamente', async () => {
    const payload = {
      nome: 'Nova Loja',
      descricao: 'Desc',
      categoria: 'SURF_SHOP' as const,
      latitude: 10,
      longitude: 20,
      beachId: 1,
    };
    const mockResponse = { id: 5, ...payload };
    (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

    const result = await poiService.createPoi(payload);

    expect(api.post).toHaveBeenCalledWith('/api/pois', expect.objectContaining({
      nome: 'Nova Loja',
      beach: { id: 1 }
    }));
    expect(result).toEqual(mockResponse);
  });
});
