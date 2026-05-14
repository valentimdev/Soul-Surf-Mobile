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
  };
});

// Mock do contexto de notificacoes
jest.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    refreshing: false,
    error: null,
    isRealtimeConnected: false,
    loadNotifications: jest.fn().mockResolvedValue(undefined),
    refreshUnreadCount: jest.fn().mockResolvedValue(undefined),
    markAsRead: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock do expo-router
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    React.useEffect(callback, []);
  },
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
  it('deve renderizar a tela de notificações', async () => {
    let tree: any;
    await act(async () => {
      tree = create(React.createElement(NotificationsScreen));
    });
    expect(tree).toBeDefined();
  });
});
