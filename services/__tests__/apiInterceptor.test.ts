import * as SecureStore from 'expo-secure-store';

import api from '../api';

describe('api request interceptor', () => {
  const requestHandlers = (api.interceptors.request as any).handlers as Array<{
    fulfilled: (config: any) => Promise<any>;
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
});
