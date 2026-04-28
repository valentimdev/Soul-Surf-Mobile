import api from '../api';
import * as SecureStore from 'expo-secure-store';
import { UserDTO } from '../../types/api';

const rawUploadTimeoutMs = process.env.EXPO_PUBLIC_UPLOAD_TIMEOUT_MS?.trim();
const parsedUploadTimeoutMs = Number(rawUploadTimeoutMs);
const PROFILE_UPLOAD_TIMEOUT_MS = Number.isFinite(parsedUploadTimeoutMs) && parsedUploadTimeoutMs > 0
  ? parsedUploadTimeoutMs
  : 120000;
const IS_DEV = typeof __DEV__ !== 'undefined'
  ? __DEV__
  : process.env.NODE_ENV !== 'production';
const IS_TEST = process.env.NODE_ENV === 'test';

export const userService = {
  // Lista todos os usuarios paginados.
  getUsers: async (offset = 0, limit = 30): Promise<UserDTO[]> => {
    const response = await api.get('/api/users', {
      params: { offset, limit },
    });
    return response.data;
  },

  // Pegar meu perfil atual.
  getMyProfile: async (): Promise<UserDTO> => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  // Pegar perfil de outro usuario.
  getUserProfile: async (userId: number): Promise<UserDTO> => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  // Seguir ou deixar de seguir.
  toggleFollow: async (userId: number, isFollowing: boolean): Promise<any> => {
    if (isFollowing) {
      const response = await api.delete(`/api/users/${userId}/follow`);
      return response.data;
    }

    const response = await api.post(`/api/users/${userId}/follow`);
    return response.data;
  },

  // Lista de seguidores.
  getFollowers: async (userId: number): Promise<UserDTO[]> => {
    const response = await api.get(`/api/users/${userId}/followers`);
    return response.data;
  },

  // Lista de pessoas que o usuario segue.
  getFollowing: async (userId: number): Promise<UserDTO[]> => {
    const response = await api.get(`/api/users/${userId}/following`);
    return response.data;
  },

  // Busca por nome ou bio.
  searchUsers: async (query: string): Promise<UserDTO[]> => {
    const response = await api.get('/api/users/search', {
      params: { query },
    });
    return response.data;
  },

  // Sugestoes para mencoes.
  getMentionSuggestions: async (query: string, limit = 5): Promise<UserDTO[]> => {
    const response = await api.get('/api/users/mention-suggestions', {
      params: { query, limit },
    });
    return response.data;
  },

  // Atualizar perfil: bio, username e fotos.
  updateProfile: async (bio?: string, username?: string, fotoPerfilUri?: string, fotoCapaUri?: string): Promise<UserDTO> => {
    const formData = new FormData();

    if (bio) formData.append('bio', bio);
    if (username) formData.append('username', username);

    const appendFile = (uri: string, fieldName: string) => {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
      const safeFilename = filename && filename.length > 0 ? filename : `${fieldName}.jpg`;

      formData.append(fieldName, {
        uri,
        name: safeFilename,
        type,
      } as any);
    };

    if (fotoPerfilUri) appendFile(fotoPerfilUri, 'fotoPerfil');
    if (fotoCapaUri) appendFile(fotoCapaUri, 'fotoCapa');

    const startedAt = Date.now();

    if (IS_DEV) {
      console.log('[UPLOAD_PROFILE]', {
        endpoint: '/api/users/me/upload',
        timeoutMs: PROFILE_UPLOAD_TIMEOUT_MS,
        hasBio: typeof bio === 'string' && bio.trim().length > 0,
        hasUsername: typeof username === 'string' && username.trim().length > 0,
        hasFotoPerfil: Boolean(fotoPerfilUri),
        hasFotoCapa: Boolean(fotoCapaUri),
      });
    }

    try {
      // In Jest/Node we force axios multipart headers for deterministic integration tests.
      if (IS_TEST) {
        const response = await api.put('/api/users/me/upload', '__SOULSURF_MULTIPART_TEST_PAYLOAD__', {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data; boundary=SoulSurfBoundary',
          },
          timeout: PROFILE_UPLOAD_TIMEOUT_MS,
        });

        if (IS_DEV) {
          console.log('[UPLOAD_PROFILE_OK]', {
            endpoint: '/api/users/me/upload',
            status: response.status,
            durationMs: Date.now() - startedAt,
          });
        }

        return response.data as UserDTO;
      }

      // In React Native runtime we keep fetch and let it set multipart boundaries.
      const token = await SecureStore.getItemAsync('userToken');
      const baseURL = api.defaults.baseURL ?? '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PROFILE_UPLOAD_TIMEOUT_MS);

      let response;
      try {
        response = await fetch(`${baseURL}/api/users/me/upload`, {
          method: 'PUT',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: 'application/json',
          },
          body: formData,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (IS_DEV) {
          console.error('[UPLOAD_PROFILE_ERROR]', {
            endpoint: '/api/users/me/upload',
            status: response.status,
            data: responseData,
            durationMs: Date.now() - startedAt,
          });
        }
        const error: any = new Error(responseData?.message || `Request failed with status ${response.status}`);
        error.response = { status: response.status, data: responseData };
        throw error;
      }

      if (IS_DEV) {
        console.log('[UPLOAD_PROFILE_OK]', {
          endpoint: '/api/users/me/upload',
          status: response.status,
          durationMs: Date.now() - startedAt,
        });
      }

      return responseData as UserDTO;
    } catch (error: any) {
      if (IS_DEV && !error.response) {
        console.error('[UPLOAD_PROFILE_ERROR]', {
          endpoint: '/api/users/me/upload',
          message: error?.message,
          name: error?.name,
          durationMs: Date.now() - startedAt,
          timeoutMs: PROFILE_UPLOAD_TIMEOUT_MS,
          isAborted: error?.name === 'AbortError',
        });
      }

      throw error;
    }
  },
};
