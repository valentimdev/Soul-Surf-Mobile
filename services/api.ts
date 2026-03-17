// services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// 1. Cria a instância com o endereço do seu backend
const api = axios.create({
  baseURL: 'http://147.15.58.134:8080/api',
  timeout: 10000, // Cancela a requisição se demorar mais de 10 segundos
});

// 2. Interceptor de Requisição (A mágica do Token)
// Antes de QUALQUER requisição sair do app, esse código roda.
api.interceptors.request.use(
  async (config) => {
    // Busca o token salvo no celular
    const token = await SecureStore.getItemAsync('userToken');

    // Se tiver token, injeta no cabeçalho Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;