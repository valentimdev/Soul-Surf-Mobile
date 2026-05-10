import React from 'react';
import BeachDetailsScreen from '../app/beach/[id]';
import { beachService } from '../services/beaches/beachService';

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
  };
});

// Mock dos services
jest.mock('../services/beaches/beachService', () => ({
  beachService: {
    getBeachById: jest.fn(),
    getBeachPostsPublic: jest.fn(),
    getMyPosts: jest.fn(),
    getBeachMessages: jest.fn(),
  },
}));

jest.mock('../services/weather/surfConditionsService', () => ({
  surfConditionsService: {
    getSurfConditions: jest.fn(),
  },
}));

// Mock do expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useNavigation: () => ({ setOptions: jest.fn() }),
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock do Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('BeachDetailsScreen UI', () => {
  it('deve renderizar a tela de detalhes da praia', async () => {
    (beachService.getBeachById as jest.Mock).mockResolvedValue({ id: 1, nome: 'Praia do Rosa' });
    (beachService.getBeachPostsPublic as jest.Mock).mockResolvedValue([]);
    (beachService.getMyPosts as jest.Mock).mockResolvedValue([]);
    (beachService.getBeachMessages as jest.Mock).mockResolvedValue([]);

    let tree: any;
    await act(async () => {
      tree = create(React.createElement(BeachDetailsScreen));
    });
    expect(tree).toBeDefined();
  });
});
