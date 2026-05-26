import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router'; // <-- Adicionado para roteamento global

const rawTimeoutMs = process.env.EXPO_PUBLIC_API_TIMEOUT_MS?.trim();
const parsedTimeoutMs = Number(rawTimeoutMs);
const API_TIMEOUT_MS = Number.isFinite(parsedTimeoutMs) && parsedTimeoutMs > 0
  ? parsedTimeoutMs
  : 30000;
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

  if (normalized) {
    return normalized;
  }

  return DEV_FALLBACK_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

function getHeaderValue(headers: any, key: string): string | undefined {
  if (!headers) return undefined;

  if (typeof headers.get === 'function') {
    const value = headers.get(key) ?? headers.get(key.toLowerCase());
    return typeof value === 'string' ? value : undefined;
  }

  const value = headers[key] ?? headers[key.toLowerCase()];
  return typeof value === 'string' ? value : undefined;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    (config as any).metadata = {
      startedAt: Date.now(),
    };

    const token = await SecureStore.getItemAsync('userToken');
    if (config.headers.Authorization === '') {
      delete config.headers.Authorization;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (IS_DEV) {
      console.log('[API]', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL ?? ''}${config.url ?? ''}`,
        timeoutMs: config.timeout ?? API_TIMEOUT_MS,
        contentType: getHeaderValue(config.headers, 'Content-Type'),
      });
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (IS_DEV) {
      const startedAt = (response.config as any)?.metadata?.startedAt;
      const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;

      console.log('[API OK]', {
        method: response.config?.method?.toUpperCase(),
        url: `${response.config?.baseURL ?? ''}${response.config?.url ?? ''}`,
        status: response.status,
        durationMs,
      });
    }

    return response;
  },
  async (error) => {
    const status = error.response?.status;

    if (IS_DEV) {
      const method = error.config?.method?.toUpperCase();
      const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
      const data = error.response?.data;
      const startedAt = error.config?.metadata?.startedAt;
      const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
      const timeoutMs = error.config?.timeout ?? API_TIMEOUT_MS;
      const isTimeout = error.code === 'ECONNABORTED';
      const isNetworkError = !error.response && Boolean(error.request);

      const logPayload = {
        method,
        url,
        status,
        data,
        message: error.message,
        code: error.code,
        timeoutMs,
        durationMs,
        isTimeout,
        isNetworkError,
      };

      // Se for erro de autenticação, logamos como aviso (amarelo) pra não forçar a tela vermelha
      if (status === 401 || status === 403) {
        console.warn('[API UNAUTHORIZED/FORBIDDEN]', logPayload);
      } else {
        console.error('[API ERROR]', logPayload);
      }
    }

    // <-- LOGICA GLOBAL DE LOGOUT AQUI -->
    if (error.response && (status === 401 || status === 403)) {
      try {
        await SecureStore.deleteItemAsync('userToken');
        router.replace('/api/auth/login');
      } catch (logoutError) {
        console.error('Erro ao forçar logout:', logoutError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;