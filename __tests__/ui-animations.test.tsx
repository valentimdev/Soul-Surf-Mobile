import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BottomSheet from '../components/BottomSheet';
import { View, Text } from 'react-native';

// Mock do react-native
jest.mock('react-native', () => {
  const React = require('react');
  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);

  return {
    Dimensions: {
      get: () => ({ height: 800, width: 400 }),
    },
    Pressable: make('Pressable'),
    StyleSheet: {
      create: (s: any) => s,
      absoluteFillObject: {},
    },
    Text: make('Text'),
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

describe('BottomSheet UI', () => {
  it('deve renderizar o conteúdo quando visível', () => {
    const { getByText } = render(
      <BottomSheet visible={true} onClose={() => {}}>
        <View><Text>Conteúdo do Sheet</Text></View>
      </BottomSheet>
    );
    expect(getByText('Conteúdo do Sheet')).toBeTruthy();
  });
});
