// Disable dev logs inside API interceptor during tests.
(global as any).__DEV__ = false;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: {
    Images: 'Images',
  },
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: 'test-project-id',
        },
      },
    },
    easConfig: {
      projectId: 'test-project-id',
    },
  },
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    MAX: 'max',
  },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExpoPushToken[test]' }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    SafeAreaProvider: make('SafeAreaProvider'),
    SafeAreaView: make('SafeAreaView'),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    __esModule: true,
    default: {
      View: make('Animated.View'),
      Text: make('Animated.Text'),
      ScrollView: make('Animated.ScrollView'),
      Image: make('Animated.Image'),
      createAnimatedComponent: (component: any) => component,
    },
    Easing: {
      cubic: jest.fn(),
      out: jest.fn((value) => value),
    },
    runOnJS: (fn: (...args: any[]) => any) => fn,
    useAnimatedStyle: (factory: () => any) => factory(),
    useSharedValue: (initialValue: any) => ({ value: initialValue }),
    withTiming: (value: any) => value,
  };
});
