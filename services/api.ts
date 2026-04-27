import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const IS_DEV = typeof __DEV__ !== 'undefined'
  ? __DEV__
  : process.env.NODE_ENV !== 'production';
const IS_TEST = process.env.NODE_ENV === 'test';
const DEV_FALLBACK_API_URL = 'http://147.15.58.134:8080';

function sanitizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveApiBaseUrl(): string {
  const rawBaseURL = process.env.EXPO_PUBLIC_API_URL?.trim();
  const normalized = rawBaseURL && rawBaseURL.length > 0
    ? sanitizeBaseUrl(rawBaseURL)
    : null;

  // In production, we require explicit HTTPS to prevent token/API traffic over clear-text HTTP.
  if (process.env.NODE_ENV === 'production') {
    if (!normalized) {
      throw new Error('EXPO_PUBLIC_API_URL is required in production.');
    }

    if (!normalized.startsWith('https://')) {
      throw new Error('EXPO_PUBLIC_API_URL must use HTTPS in production.');
    }

    return normalized;
  }

  if (normalized) {
    return normalized;
  }

  if (IS_DEV || IS_TEST) {
    return DEV_FALLBACK_API_URL;
  }

  throw new Error('Unable to resolve API base URL. Set EXPO_PUBLIC_API_URL.');
}

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor para injetar o token automaticamente
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (IS_DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (IS_DEV) {
      const method = error.config?.method?.toUpperCase();
      const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
      const status = error.response?.status;
      const data = error.response?.data;

      console.error('[API ERROR]', {
        method,
        url,
        status,
        data,
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
