import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const rawBaseURL = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_BASE_URL = (rawBaseURL && rawBaseURL.length > 0
  ? rawBaseURL
  : 'http://147.15.58.134:8080').replace(/\/+$/, '');

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
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
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
