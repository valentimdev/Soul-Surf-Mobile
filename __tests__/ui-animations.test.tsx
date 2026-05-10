import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BottomSheet from '../components/BottomSheet';
import { View, Text, TouchableOpacity } from 'react-native';

// Mock do react-native para evitar erros de transformação
jest.mock('react-native', () => {
  const React = require('react');
  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    Dimensions: {
      get: () => ({ height: 800, width: 400 }),
    },
    Image: make('Image'),
    Pressable: make('Pressable'),
    SafeAreaView: make('SafeAreaView'),
    ScrollView: make('ScrollView'),
    StyleSheet: {
      create: (s: any) => s,
      absoluteFillObject: {},
    },
    Text: make('Text'),
    TouchableOpacity: make('TouchableOpacity'),
    View: make('View'),
  };
});

// Mock do react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock do react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    Gesture: {
      Pan: () => ({
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      }),
    },
    GestureDetector: ({ children }: any) => children,
    GestureHandlerRootView: ({ children }: any) => children,
  };
});

describe('BottomSheet UI and Animation Trigger', () => {
  it('não deve renderizar quando visible é false', () => {
    const { queryByTestId } = render(
      <BottomSheet visible={false} onClose={() => {}}>
        <View><Text>Conteúdo do Sheet</Text></View>
      </BottomSheet>
    );

    expect(queryByTestId('bottom-sheet-content')).toBeNull();
  });

  it('deve renderizar o conteúdo quando visible é true', () => {
    // Adicionamos um testID ao container para facilitar
    const { getByText } = render(
      <BottomSheet visible={true} onClose={() => {}}>
        <View><Text>Conteúdo do Sheet</Text></View>
      </BottomSheet>
    );

    expect(getByText('Conteúdo do Sheet')).toBeTruthy();
  });

  it('deve chamar onClose ao clicar no backdrop', () => {
    const mockOnClose = jest.fn();
    const { getByTestId } = render(
      <BottomSheet visible={true} onClose={mockOnClose}>
        <View><Text>Conteúdo</Text></View>
      </BottomSheet>
    );

    const backdrop = getByTestId('bottom-sheet-backdrop');
    fireEvent.press(backdrop);
    expect(mockOnClose).toHaveBeenCalled();
  });
});

// Teste de acionamento em uma tela real (ex: Perfil)
import ProfileScreen from '../app/(tabs)/profile';
import { userService } from '../services/users/userService';

jest.mock('../services/users/userService', () => ({
  userService: {
    getMyProfile: jest.fn(),
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
    useFocusEffect: (callback: () => void) => React.useEffect(callback, []),
    useRouter: () => ({ push: jest.fn() }),
}));

describe('ProfileScreen BottomSheet Trigger', () => {
    const mockUser = {
        id: 1,
        username: 'testuser',
        followersCount: 10,
        followingCount: 5,
    };

    beforeEach(() => {
        (userService.getMyProfile as jest.Mock).mockResolvedValue(mockUser);
        (userService.getFollowers as jest.Mock).mockResolvedValue([]);
        (userService.getFollowing as jest.Mock).mockResolvedValue([]);
    });

    it('deve abrir o BottomSheet ao clicar em seguidores', async () => {
        const { getByText, queryByText, findByText } = render(<ProfileScreen />);
        
        // Aguarda carregar o perfil
        const followersButton = await findByText('10 seguidores');
        fireEvent.press(followersButton);

        // Verifica se o título do sheet aparece (Seguidores)
        // O BottomSheet no ProfileScreen tem um <Text style={styles.sheetTitle}>
        await waitFor(() => {
            expect(getByText('Seguidores')).toBeTruthy();
        });
    });
});
