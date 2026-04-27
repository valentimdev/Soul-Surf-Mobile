import * as SecureStore from 'expo-secure-store';

import api from '../api';

describe('api request interceptor', () => {
  const requestHandlers = (api.interceptors.request as any).handlers as Array<{
    fulfilled: (config: any) => Promise<any>;
  }>;
  const responseHandlers = (api.interceptors.response as any).handlers as Array<{
    fulfilled: (response: any) => any;
    rejected: (error: any) => Promise<never>;
  }>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('injeta Authorization Bearer quando houver token salvo', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('jwt-token');

    const config = await requestHandlers[0].fulfilled({
      headers: {},
      method: 'get',
      baseURL: 'http://localhost:8080',
      url: '/api/users/me',
    });

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
    expect(config.headers.Authorization).toBe('Bearer jwt-token');
  });

  test('mantem a requisicao sem Authorization quando nao houver token salvo', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const config = await requestHandlers[0].fulfilled({
      headers: {},
      method: 'get',
      baseURL: 'http://localhost:8080',
      url: '/api/beaches',
    });

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
    expect(config.headers.Authorization).toBeUndefined();
  });

  test('propaga erro quando falhar ao ler token no SecureStore', async () => {
    const storageError = new Error('SecureStore indisponivel');
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(storageError);

    await expect(
      requestHandlers[0].fulfilled({
        headers: {},
        method: 'get',
        baseURL: 'http://localhost:8080',
        url: '/api/users/me',
      })
    ).rejects.toBe(storageError);
  });

  test('interceptor de response retorna sucesso sem alterar payload', () => {
    const response = { data: { ok: true }, status: 200 };

    expect(responseHandlers[0].fulfilled(response)).toBe(response);
  });

  test('interceptor de response propaga erro original sem mascarar', async () => {
    const error = {
      message: 'Erro interno',
      config: { method: 'get', baseURL: 'http://localhost:8080', url: '/api/fail' },
      response: { status: 500, data: { message: 'Falha' } },
    };

    await expect(responseHandlers[0].rejected(error)).rejects.toBe(error);
  });
});
