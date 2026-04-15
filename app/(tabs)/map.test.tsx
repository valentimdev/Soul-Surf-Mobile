import { render, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import React from 'react';
import MapScreen from './map';

// Mock do expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    High: 3,
  },
}));

// Mock do maplibre
jest.mock('@maplibre/maplibre-react-native', () => ({
  MapView: ({ children }: any) => <>{children}</>,
  Camera: () => null,
}));

// Mock do lucide-react-native
jest.mock('lucide-react-native', () => ({
  GraduationCap: () => null,
  Search: () => null,
  Store: () => null,
  Waves: () => null,
  Wrench: () => null,
  Map: () => null,
  MessageCircle: () => null,
  Bell: () => null,
  User: () => null,
}));

describe('MapScreen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exibir mensagem de carregamento inicialmente', () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { getByText } = render(<MapScreen />);
    expect(getByText(/Solicitando permissao/i)).toBeTruthy();
  });

  it('deve exibir mensagem de erro quando a permissao for negada', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const { getByText } = render(<MapScreen />);

    await waitFor(() => {
      expect(getByText(/Permissao de localizacao negada/i)).toBeTruthy();
    });
  });

  it('deve exibir o mapa quando a permissao for concedida', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: -3.7172,
        longitude: -38.5016,
      },
    });

    const { getByPlaceholderText } = render(<MapScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText(/Buscar picos/i)).toBeTruthy();
    });
  });

  it('deve tratar erro quando o GPS falhar mesmo com permissao', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('GPS Error'));

    const { getByPlaceholderText } = render(<MapScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText(/Buscar picos/i)).toBeTruthy();
    });
  });
});
