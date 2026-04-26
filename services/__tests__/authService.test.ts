jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

import api from '../api';
import { authService } from '../auth/authService';

describe('authService unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('login envia credenciais para o endpoint correto', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { token: 'jwt-token' } });

    await expect(authService.login('teste@soulsurf.com', '123456')).resolves.toEqual({
      token: 'jwt-token',
    });

    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'teste@soulsurf.com',
      password: '123456',
    });
  });

  test('signup envia email, senha e username para o endpoint correto', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { id: 1, username: 'samuca' } });

    await expect(authService.signup('samuca@soulsurf.com', '123456', 'samuca')).resolves.toEqual({
      id: 1,
      username: 'samuca',
    });

    expect(api.post).toHaveBeenCalledWith('/api/auth/signup', {
      email: 'samuca@soulsurf.com',
      password: '123456',
      username: 'samuca',
    });
  });

  test('forgotPassword envia o email para o endpoint correto', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { message: 'Email enviado' } });

    await expect(authService.forgotPassword('samuca@soulsurf.com')).resolves.toEqual({
      message: 'Email enviado',
    });

    expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
      email: 'samuca@soulsurf.com',
    });
  });

  test('resetPassword envia token e nova senha para o endpoint correto', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { message: 'Senha alterada' } });

    await expect(authService.resetPassword('reset-token', 'nova-senha')).resolves.toEqual({
      message: 'Senha alterada',
    });

    expect(api.post).toHaveBeenCalledWith('/api/auth/reset-password', {
      token: 'reset-token',
      newPassword: 'nova-senha',
    });
  });

  test('propaga erros do login sem mascarar a resposta da API', async () => {
    const error = { response: { status: 401, data: { message: 'Credenciais inválidas' } } };
    (api.post as jest.Mock).mockRejectedValue(error);

    await expect(authService.login('teste@soulsurf.com', 'errada')).rejects.toBe(error);
  });

  test('propaga erros do cadastro sem mascarar a resposta da API', async () => {
    const error = { response: { status: 400, data: { message: 'Usuário já existe' } } };
    (api.post as jest.Mock).mockRejectedValue(error);

    await expect(
      authService.signup('samuca@soulsurf.com', '123456', 'samuca')
    ).rejects.toBe(error);
  });

  test('propaga erros do forgotPassword sem mascarar a resposta da API', async () => {
    const error = { response: { status: 404, data: { message: 'Email não encontrado' } } };
    (api.post as jest.Mock).mockRejectedValue(error);

    await expect(authService.forgotPassword('naoexiste@soulsurf.com')).rejects.toBe(error);
  });

  test('propaga erros do resetPassword sem mascarar a resposta da API', async () => {
    const error = { response: { status: 400, data: { message: 'Token inválido' } } };
    (api.post as jest.Mock).mockRejectedValue(error);

    await expect(authService.resetPassword('token-errado', 'nova-senha')).rejects.toBe(error);
  });
});
