import React from 'react';
import NotificationsScreen from '../app/(tabs)/notifications';

const TestRenderer = require('react-test-renderer');
const { act, create } = TestRenderer;

// Mock do react-native
jest.mock('react-native', () => {
  const React = require('react');
  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    ActivityIndicator: make('ActivityIndicator'),
    RefreshControl: make('RefreshControl'),
    SafeAreaView: make('SafeAreaView'),
    ScrollView: make('ScrollView'),
    StyleSheet: {
      create: (s: any) => s,
    },
    Text: make('Text'),
    TouchableOpacity: make('TouchableOpacity'),
    View: make('View'),
    Image: make('Image'),
  };
});

// Mock do NotificationService
jest.mock('@/services/notifications/notificationService', () => ({
  notificationService: {
    getUserNotifications: jest.fn().mockResolvedValue([]),
    markAsRead: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock do UserService
jest.mock('@/services/users/userService', () => ({
  userService: {
    getMyProfile: jest.fn().mockResolvedValue({ id: 1, username: 'testuser' }),
    getFollowing: jest.fn().mockResolvedValue([]),
    toggleFollow: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock do PostService
jest.mock('@/services/posts/postService', () => ({
  postService: {
    getPostById: jest.fn().mockResolvedValue(null),
  },
}));

// Mock do expo-router
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: any) => {
    React.useEffect(() => {
      const cleanup = callback();
      if (typeof cleanup === 'function') {
        return cleanup;
      }
    }, [callback]);
  },
  router: {
    push: jest.fn(),
  }
}));

// Mock do lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const Icon = (props: any) => React.createElement('Icon', props);
  return {
    Clock: Icon,
    MessageSquare: Icon,
    Star: Icon,
    Waves: Icon,
  };
});

describe('NotificationsScreen', () => {
  it('deve renderizar a tela de notificações sem erros assíncronos', async () => {
    let tree: any;
    await act(async () => {
      tree = create(React.createElement(NotificationsScreen));
    });
    expect(tree).toBeDefined();
  });
});