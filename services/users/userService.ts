import { api } from '../api';
import { UserDTO } from '../../types/api';

export const userService = {
  // Pegar Meu Perfil Atual
  getMyProfile: async (): Promise<UserDTO> => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  // Pegar Perfil de Outro Usuário
  getUserProfile: async (userId: number): Promise<UserDTO> => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  // Seguir / Deixar de Seguir
  toggleFollow: async (userId: number, isFollowing: boolean): Promise<any> => {
    if (isFollowing) {
        const response = await api.delete(`/api/users/${userId}/follow`);
        return response.data;
    } else {
        const response = await api.post(`/api/users/${userId}/follow`);
        return response.data;
    }
  },

  // Lista de seguidores de um usuário
  getFollowers: async (userId: number): Promise<UserDTO[]> => {
    const response = await api.get(`/api/users/${userId}/followers`);
    return response.data;
  },

  // Lista de pessoas que o usuário segue
  getFollowing: async (userId: number): Promise<UserDTO[]> => {
    const response = await api.get(`/api/users/${userId}/following`);
    return response.data;
  },

  // Buscar usuários por nome ou bio
  searchUsers: async (query: string): Promise<UserDTO[]> => {
    const response = await api.get('/api/users/search', {
      params: { query }
    });
    return response.data;
  },

  // Sugestões para menções (@)
  getMentionSuggestions: async (query: string, limit = 5): Promise<UserDTO[]> => {
    const response = await api.get('/api/users/mention-suggestions', {
      params: { query, limit }
    });
    return response.data;
  },

  // Atualizar Perfil: Bio e Fotos
  updateProfile: async (bio?: string, username?: string, fotoPerfilUri?: string, fotoCapaUri?: string): Promise<UserDTO> => {
    const formData = new FormData();

    if (bio) formData.append('bio', bio);
    if (username) formData.append('username', username);

    const appendFile = (uri: string, fieldName: string) => {
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append(fieldName, {
            uri,
            name: filename,
            type,
        } as any);
    };

    if (fotoPerfilUri) appendFile(fotoPerfilUri, 'fotoPerfil');
    if (fotoCapaUri) appendFile(fotoCapaUri, 'fotoCapa');

    const response = await api.put('/api/users/me/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
};
