import { beachService } from '@/services/beaches/beachService';
import api from '@/services/api';

// Mock do módulo api
jest.mock('@/services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('beachService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve buscar todas as praias e normalizar a lista', async () => {
    const mockBeaches = [{ id: 1, nome: 'Praia do Futuro' }];
    (api.get as jest.Mock).mockResolvedValue({ data: mockBeaches });

    const result = await beachService.getAllBeaches();

    expect(api.get).toHaveBeenCalledWith('/api/beaches');
    expect(result).toEqual(mockBeaches);
  });

  it('deve buscar uma praia específica por ID', async () => {
    const mockBeach = { id: 1, nome: 'Praia do Futuro' };
    (api.get as jest.Mock).mockResolvedValue({ data: mockBeach });

    const result = await beachService.getBeachById(1);

    expect(api.get).toHaveBeenCalledWith('/api/beaches/1');
    expect(result).toEqual(mockBeach);
  });

  it('deve postar uma mensagem na praia corretamente', async () => {
    const mockMessage = { id: 10, texto: 'Boas ondas!' };
    (api.post as jest.Mock).mockResolvedValue({ data: mockMessage });

    const result = await beachService.postBeachMessage(1, 'Boas ondas!');

    expect(api.post).toHaveBeenCalledWith('/api/beaches/1/mensagens', null, {
      params: { texto: 'Boas ondas!' },
    });
    expect(result).toEqual(mockMessage);
  });

  it('deve criar praia com coordenadas', async () => {
    const mockBeach = {
      id: 7,
      nome: 'Praia Nova',
      latitude: -3.7,
      longitude: -38.5,
    };
    (api.post as jest.Mock).mockResolvedValue({ data: mockBeach });

    const result = await beachService.createBeach({
      nome: 'Praia Nova',
      descricao: 'Boa para surf',
      localizacao: 'Fortaleza',
      nivelExperiencia: 'Intermediario',
      latitude: -3.7,
      longitude: -38.5,
    });

    expect(api.post).toHaveBeenCalledWith(
      '/api/beaches/',
      expect.any(FormData),
      expect.objectContaining({
        transformRequest: expect.any(Function),
      })
    );
    expect(result).toEqual(mockBeach);
  });
});
