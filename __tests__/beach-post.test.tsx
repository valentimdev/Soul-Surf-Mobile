import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BeachDetailsScreen from '../app/beach/[id]';
import { beachService } from '../services/beaches/beachService';
import { surfConditionsService } from '../services/weather/surfConditionsService';

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

describe('BeachDetailsScreen - Post Animation/Modal Trigger', () => {
  const mockBeach = { id: 1, nome: 'Praia do Rosa', descricao: 'Linda praia' };

  beforeEach(() => {
    jest.clearAllMocks();
    (beachService.getBeachById as jest.Mock).mockResolvedValue(mockBeach);
    (beachService.getBeachPostsPublic as jest.Mock).mockResolvedValue([]);
    (beachService.getMyPosts as jest.Mock).mockResolvedValue([]);
    (beachService.getBeachMessages as jest.Mock).mockResolvedValue([]);
    (surfConditionsService.getSurfConditions as jest.Mock).mockResolvedValue(null);
  });

  it('deve abrir o modal de novo post ao clicar em Adicionar', async () => {
    const { getByText, queryByPlaceholderText } = render(<BeachDetailsScreen />);

    // Aguarda o carregamento da tela
    await waitFor(() => {
      expect(getByText('Praia do Rosa')).toBeTruthy();
    });

    // Clica no botão "Adicionar"
    const addButton = getByText('Adicionar');
    fireEvent.press(addButton);

    // Verifica se o modal abriu (procurando pelo placeholder do input no modal)
    await waitFor(() => {
      expect(queryByPlaceholderText('O que rolou no mar hoje? (Opcional)')).toBeTruthy();
    });
  });
});
