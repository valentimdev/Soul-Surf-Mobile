import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { authService } from '../auth/authService';

describe('authService API integration (HTTP mocked)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.clearAllMocks();
  });

  test('login deve consumir POST /api/auth/login', async () => {
    const payload = { token: 'jwt-token' };

    mock.onPost('/api/auth/login').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        email: 'teste@soulsurf.com',
        password: '123456',
      });
      return [200, payload];
    });

    await expect(authService.login('teste@soulsurf.com', '123456')).resolves.toEqual(payload);
  });

  test('signup deve consumir POST /api/auth/signup', async () => {
    const payload = { id: 1, username: 'samuca' };

    mock.onPost('/api/auth/signup').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        email: 'samuca@soulsurf.com',
        password: '123456',
        username: 'samuca',
      });
      return [200, payload];
    });

    await expect(authService.signup('samuca@soulsurf.com', '123456', 'samuca')).resolves.toEqual(payload);
  });

  test('forgotPassword deve consumir POST /api/auth/forgot-password', async () => {
    const payload = { message: 'Email enviado' };

    mock.onPost('/api/auth/forgot-password').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        email: 'samuca@soulsurf.com',
      });
      return [200, payload];
    });

    await expect(authService.forgotPassword('samuca@soulsurf.com')).resolves.toEqual(payload);
  });

  test('resetPassword deve consumir POST /api/auth/reset-password', async () => {
    const payload = { message: 'Senha alterada' };

    mock.onPost('/api/auth/reset-password').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        token: 'reset-token',
        newPassword: 'nova-senha',
      });
      return [200, payload];
    });

    await expect(authService.resetPassword('reset-token', 'nova-senha')).resolves.toEqual(payload);
  });

  test('login deve propagar erro HTTP', async () => {
    mock.onPost('/api/auth/login').reply(401, { message: 'Credenciais inválidas' });

    await expect(authService.login('invalido@soulsurf.com', 'errada')).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});

