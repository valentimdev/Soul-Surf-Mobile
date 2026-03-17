import axios from 'axios';

// Criação da instância do Axios apontando para o back-end na nuvem
export const api = axios.create({
  baseURL: 'http://147.15.58.134:8080',
  timeout: 10000, // Timeout de 10 segundos para requisições
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor de Requisição (útil para injetar tokens JWT, por exemplo)
api.interceptors.request.use(
  async (config) => {
    // Exemplo:
    // const token = await AsyncStorage.getItem('@token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta (útil para tratamento global de erros da API)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento global de erros (ex: 401 Unauthorized -> deslogar o usuário)
    if (error.response) {
      console.error('Erro na API:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Sem resposta do servidor. Verifique sua conexão.');
    }
    return Promise.reject(error);
  }
);
