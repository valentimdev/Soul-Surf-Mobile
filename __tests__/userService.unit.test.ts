import { userService } from '@/services/users/userService';
import api from '@/services/api';

// Mock do módulo api
jest.mock('@/services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  put: jest.fn(),
  defaults: { baseURL: 'http://test-api.com' }
}));

describe('userService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve buscar o perfil do usuário logado', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@test.com' };
    (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

    const result = await userService.getMyProfile();

    expect(api.get).toHaveBeenCalledWith('/api/users/me');
    expect(result).toEqual(mockUser);
  });

  it('deve buscar perfil de outro usuário por ID', async () => {
    const mockUser = { id: 2, username: 'otheruser' };
    (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

    const result = await userService.getUserProfile(2);

    expect(api.get).toHaveBeenCalledWith('/api/users/2');
    expect(result).toEqual(mockUser);
  });

  it('deve alternar o estado de seguir (follow/unfollow)', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    (api.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

    // Testar follow
    await userService.toggleFollow(10, false);
    expect(api.post).toHaveBeenCalledWith('/api/users/10/follow');

    // Testar unfollow
    await userService.toggleFollow(10, true);
    expect(api.delete).toHaveBeenCalledWith('/api/users/10/follow');
  });

  it('deve buscar seguidores de um usuário', async () => {
    const mockFollowers = [{ id: 3, username: 'follower' }];
    (api.get as jest.Mock).mockResolvedValue({ data: mockFollowers });

    const result = await userService.getFollowers(1);

    expect(api.get).toHaveBeenCalledWith('/api/users/1/followers');
    expect(result).toEqual(mockFollowers);
  });

  it('deve realizar busca de usuários por query', async () => {
    const mockResults = [{ id: 4, username: 'surf_expert' }];
    (api.get as jest.Mock).mockResolvedValue({ data: mockResults });

    const result = await userService.searchUsers('surf');

    expect(api.get).toHaveBeenCalledWith('/api/users/search', {
      params: { query: 'surf' },
    });
    expect(result).toEqual(mockResults);
  });
});
