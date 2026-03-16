import { api } from '../api';

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string }> => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  signup: async (
    email: string,
    password: string,
    username: string
  ): Promise<any> => {
    const response = await api.post('/api/auth/signup', {
      email,
      password,
      username,
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },
};
