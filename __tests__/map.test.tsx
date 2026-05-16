import * as Location from 'expo-location';
import React from 'react';
import MapScreen from '../app/(tabs)/map';
import { beachService } from '../services/beaches/beachService';
import { poiService } from '../services/beaches/poiService';

const TestRenderer = require('react-test-renderer');
const { act, create } = TestRenderer;
type ReactTestRenderer = any;
type ReactTestInstance = any;

const mockPush = jest.fn();
const mockAlert = jest.fn();
const mockOpenURL = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: (...args: any[]) => mockPush(...args) }),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: {
    High: 3,
  },
}));

jest.mock('../services/beaches/beachService', () => ({
  beachService: {
    getAllBeaches: jest.fn(),
  },
}));

jest.mock('../services/beaches/poiService', () => ({
  poiService: {
    getAllPois: jest.fn(),
  },
}));

jest.mock('react-native', () => {
  const React = require('react');

  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    ActivityIndicator: make('ActivityIndicator'),
    Alert: {
      alert: (...args: any[]) => mockAlert(...args),
    },
    Linking: {
      openURL: (...args: any[]) => mockOpenURL(...args),
    },
    Platform: {
      OS: 'android',
      select: (values: Record<string, any>) => values.android ?? values.default,
    },
    Modal: make('Modal'),
    Pressable: make('Pressable'),
    StyleSheet: {
      create: (styles: any) => styles,
      absoluteFillObject: {},
    },
    Text: make('Text'),
    TextInput: make('TextInput'),
    View: make('View'),
  };
});


jest.mock('lucide-react-native', () => {
  const React = require('react');
  const Icon = (props: any) => React.createElement('Icon', props);

  return {
    GraduationCap: Icon,
    Locate: Icon,
    MapPin: Icon,
    Search: Icon,
    Store: Icon,
    Waves: Icon,
    Wrench: Icon,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');

  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    GestureHandlerRootView: make('GestureHandlerRootView'),
    TouchableOpacity: make('TouchableOpacity'),
  };
});

jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');

  return {
    MapView: ({ children, ...props }: any) => React.createElement('MapView', props, children),
    Camera: React.forwardRef(() => null),
    MarkerView: ({ children, ...props }: any) => React.createElement('MarkerView', props, children),
    PointAnnotation: ({ id, children, onSelected, ...props }: any) =>
      React.createElement('PointAnnotation', { ...props, testID: `pin-${id}`, onPress: onSelected }, children),
  };
});

jest.mock('../components/BottomSheet', () => {
  const React = require('react');

  return ({ visible, children }: any) =>
    visible ? React.createElement('BottomSheet', { testID: 'bottom-sheet' }, children) : null;
});

jest.mock('../components/sheets/PinSheet', () => {
  const React = require('react');

  return ({ pin, onOpenBeachDetails }: any) =>
    React.createElement(
      'PinSheet',
      { pinName: pin?.name },
      React.createElement('OpenBeachButton', {
        testID: 'open-beach-details',
        onPress: () => onOpenBeachDetails?.(pin),
      })
    );
});

function findByTestId(root: ReactTestInstance, testID: string): ReactTestInstance {
  const nodes = root.findAll((node: any) => node.props?.testID === testID);
  if (nodes.length === 0) {
    throw new Error(`Elemento com testID "${testID}" nao encontrado.`);
  }
  return nodes[0];
}

function findTextContaining(root: ReactTestInstance, text: string): ReactTestInstance[] {
  return root.findAll(
    (node: any) => node.type === 'Text' && typeof node.props.children === 'string' && node.props.children.includes(text)
  );
}

async function flushAsync(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('MapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: -3.7172,
        longitude: -38.5016,
      },
    });
    (Location.watchPositionAsync as jest.Mock).mockResolvedValue({ remove: jest.fn() });

    (beachService.getAllBeaches as jest.Mock).mockResolvedValue([]);
    (poiService.getAllPois as jest.Mock).mockResolvedValue([]);
  });

it('exibe carregamento enquanto aguarda permissao/localizacao', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockReturnValue(new Promise(() => {}));

    let tree: ReactTestRenderer;

    await act(async () => {
      tree = create(React.createElement(MapScreen));
    });

    const loadingTexts = findTextContaining((tree as ReactTestRenderer).root, 'Buscando sua localiza');
    expect(loadingTexts.length).toBeGreaterThan(0);
  });

  it('renderiza o campo de busca quando permissao de localizacao e negada', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(React.createElement(MapScreen));
    });

    await flushAsync();

    const textInputs = (tree as ReactTestRenderer).root.findAll(
      (node: any) => node.type === 'TextInput' && node.props.placeholder === 'Buscar picos, lojas, escolas...'
    );

    expect(textInputs.length).toBeGreaterThan(0);
  });

  it('abre Bottom Sheet ao clicar no marcador e navega para detalhes da praia', async () => {
    (beachService.getAllBeaches as jest.Mock).mockResolvedValue([
      {
        id: 1,
        nome: 'Praia do Futuro',
        latitude: -3.73,
        longitude: -38.48,
        descricao: 'Pico classico',
        localizacao: 'Fortaleza',
        caminhoFoto: '',
      },
    ]);

    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(React.createElement(MapScreen));
    });

    await flushAsync();
    await flushAsync();

    const pin = findByTestId((tree as ReactTestRenderer).root, 'pin-beach-1');
    await act(async () => {
      pin.props.onPress();
    });

    const bottomSheet = findByTestId((tree as ReactTestRenderer).root, 'bottom-sheet');
    expect(bottomSheet).toBeTruthy();

    const openBeachButton = findByTestId((tree as ReactTestRenderer).root, 'open-beach-details');
    await act(async () => {
      openBeachButton.props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '../beach/[id]',
      params: { id: '1' },
    });
  });
});




