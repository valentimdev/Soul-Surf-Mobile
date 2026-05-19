import { authService } from '@/services/auth/authService';
import api from '@/services/api';

jest.mock('@/services/api', () => ({
  post: jest.fn(),
}));

describe('authService unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve realizar login e retornar o token', async () => {
    const mockResponse = { token: 'fake-jwt-token' };
    (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

    const result = await authService.login('test@example.com', 'password123');

    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result).toEqual(mockResponse);
  });

  it('deve realizar signup com os dados corretos', async () => {
    const mockResponse = { id: 1, email: 'new@example.com' };
    (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

    const result = await authService.signup('new@example.com', 'pass123', 'user_test');

    expect(api.post).toHaveBeenCalledWith('/api/auth/signup', {
      email: 'new@example.com',
      password: 'pass123',
      username: 'user_test',
    });
    expect(result).toEqual(mockResponse);
  });

  it('deve solicitar recuperacao de senha', async () => {
    const mockResponse = { message: 'E-mail enviado' };
    (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

    const result = await authService.forgotPassword('test@example.com');

    expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
      email: 'test@example.com',
    });
    expect(result).toEqual(mockResponse);
  });

  it('deve redefinir senha com email e codigo', async () => {
    const mockResponse = { message: 'Senha alterada' };
    (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

    const result = await authService.resetPassword('test@example.com', '123456', 'novaSenha123');

    expect(api.post).toHaveBeenCalledWith('/api/auth/reset-password', {
      email: 'test@example.com',
      code: '123456',
      newPassword: 'novaSenha123',
    });
    expect(result).toEqual(mockResponse);
  });
});
