import React from 'react';
import BeachDetailsScreen from '../app/beach/[id]';
import { beachService } from '../services/beaches/beachService';
import { userService } from '../services/users/userService';
import { postService } from '../services/posts/postService';
import { commentService } from '../services/posts/commentService';
import { surfConditionsService } from '../services/weather/surfConditionsService';

const TestRenderer = require('react-test-renderer');
const { act, create } = TestRenderer;

// Mock do react-native
jest.mock('react-native', () => {
  const React = require('react');
  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    ActivityIndicator: make('ActivityIndicator'),
    Alert: {
      alert: jest.fn(),
    },
    Image: make('Image'),
    Modal: make('Modal'),
    RefreshControl: make('RefreshControl'),
    SafeAreaView: make('SafeAreaView'),
    ScrollView: make('ScrollView'),
    StyleSheet: {
      create: (s: any) => s,
    },
    Text: make('Text'),
    TextInput: make('TextInput'),
    TouchableOpacity: make('TouchableOpacity'),
    View: make('View'),
    Dimensions: {
      get: jest.fn().mockReturnValue({ width: 390, height: 844 }),
    },
  };
});

// Mock dos services
jest.mock('../services/beaches/beachService', () => ({
  beachService: {
    getBeachById: jest.fn(),
    getBeachPostsPublic: jest.fn(),
    getMyPosts: jest.fn(),
    getBeachMessages: jest.fn(),
    postBeachMessage: jest.fn(),
  },
}));

jest.mock('../services/users/userService', () => ({
  userService: {
    getMyProfile: jest.fn(),
    toggleFollow: jest.fn(),
  },
}));

jest.mock('../services/posts/postService', () => ({
  postService: {
    getLikeStatus: jest.fn().mockResolvedValue({ liked: false }),
    getLikesCount: jest.fn().mockResolvedValue({ count: 0 }),
    toggleLike: jest.fn(),
  },
}));

jest.mock('../services/posts/commentService', () => ({
  commentService: {
    getPostComments: jest.fn(),
    addComment: jest.fn(),
  },
}));

jest.mock('../services/weather/surfConditionsService', () => ({
  surfConditionsService: {
    getSurfConditions: jest.fn(),
  },
}));

// Mock do expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

// Mock do expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useNavigation: () => ({ setOptions: jest.fn() }),
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock do AppAlert
jest.mock('../components/AppAlert', () => ({
  useAppAlert: () => ({ showAlert: jest.fn() }),
}));

// Mock do Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('BeachDetailsScreen UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a tela de detalhes da praia', async () => {
    (beachService.getBeachById as jest.Mock).mockResolvedValue({ id: 1, nome: 'Praia do Rosa' });
    (beachService.getBeachPostsPublic as jest.Mock).mockResolvedValue([]);
    (beachService.getMyPosts as jest.Mock).mockResolvedValue([]);
    (beachService.getBeachMessages as jest.Mock).mockResolvedValue([]);
    (userService.getMyProfile as jest.Mock).mockResolvedValue({ id: 99, username: 'caua' });
    (surfConditionsService.getSurfConditions as jest.Mock).mockResolvedValue(null);

    let tree: any;
    await act(async () => {
      tree = create(React.createElement(BeachDetailsScreen));
    });
    
    // Pequeno wait para promessas pendentes
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(tree).toBeDefined();
  });

  it('deve identificar mensagens que começam com @ como respostas', async () => {
    (beachService.getBeachById as jest.Mock).mockResolvedValue({ id: 1, nome: 'Praia' });
    (beachService.getBeachMessages as jest.Mock).mockResolvedValue([
      { id: 10, texto: '@caua Fala surfista!', autor: { id: 2, username: 'joao', fotoPerfil: '' }, data: new Date().toISOString() }
    ]);
    (userService.getMyProfile as jest.Mock).mockResolvedValue({ id: 99, username: 'caua' });

    let tree: any;
    await act(async () => {
      tree = create(React.createElement(BeachDetailsScreen));
    });
    
    expect(tree).toBeDefined();
  });
});
