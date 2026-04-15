import api from '../api';
import { authService } from '../auth/authService';
import { MockHttpServer, setupMockHttpServer } from './helpers/mockHttpServer';

describe('authService integration (mock data + real HTTP call)', () => {
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

  test('login deve consumir POST /api/auth/login', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/auth/login',
        response: { status: 200, body: { token: 'jwt-token' } },
      },
    ]);

    await expect(authService.login('teste@soulsurf.com', '123456')).resolves.toEqual({
      token: 'jwt-token',
    });

    const request = server.getLastRequest('POST', '/api/auth/login');
    expect(request?.jsonBody).toEqual({
      email: 'teste@soulsurf.com',
      password: '123456',
    });
  });

  test('signup deve consumir POST /api/auth/signup', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/auth/signup',
        response: { status: 200, body: { id: 1, username: 'samuca' } },
      },
    ]);

    await expect(authService.signup('samuca@soulsurf.com', '123456', 'samuca')).resolves.toEqual({
      id: 1,
      username: 'samuca',
    });

    const request = server.getLastRequest('POST', '/api/auth/signup');
    expect(request?.jsonBody).toEqual({
      email: 'samuca@soulsurf.com',
      password: '123456',
      username: 'samuca',
    });
  });

  test('forgotPassword deve consumir POST /api/auth/forgot-password', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/auth/forgot-password',
        response: { status: 200, body: { message: 'Email enviado' } },
      },
    ]);

    await expect(authService.forgotPassword('samuca@soulsurf.com')).resolves.toEqual({
      message: 'Email enviado',
    });

    const request = server.getLastRequest('POST', '/api/auth/forgot-password');
    expect(request?.jsonBody).toEqual({
      email: 'samuca@soulsurf.com',
    });
  });

  test('resetPassword deve consumir POST /api/auth/reset-password', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/auth/reset-password',
        response: { status: 200, body: { message: 'Senha alterada' } },
      },
    ]);

    await expect(authService.resetPassword('reset-token', 'nova-senha')).resolves.toEqual({
      message: 'Senha alterada',
    });

    const request = server.getLastRequest('POST', '/api/auth/reset-password');
    expect(request?.jsonBody).toEqual({
      token: 'reset-token',
      newPassword: 'nova-senha',
    });
  });

  test('login deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/auth/login',
        response: { status: 401, body: { message: 'Credenciais inválidas' } },
      },
    ]);

    await expect(authService.login('invalido@soulsurf.com', 'errada')).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  test('signup deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/auth/signup',
        response: { status: 400, body: { message: 'Usuário já existe' } },
      },
    ]);

    await expect(
      authService.signup('samuca@soulsurf.com', '123456', 'samuca')
    ).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  test('forgotPassword deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/auth/forgot-password',
        response: { status: 404, body: { message: 'Usuário não encontrado' } },
      },
    ]);

    await expect(authService.forgotPassword('naoexiste@soulsurf.com')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  test('resetPassword deve propagar erro HTTP real', async () => {
    server.setRoutes([
      {
        method: 'POST',
        path: '/api/auth/reset-password',
        response: { status: 400, body: { message: 'Token inválido' } },
      },
    ]);

    await expect(authService.resetPassword('token-invalido', '12345678')).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});
