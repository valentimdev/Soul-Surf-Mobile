import React from 'react';
import BottomSheet from '../components/BottomSheet';

const TestRenderer = require('react-test-renderer');
const { act, create } = TestRenderer;

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
  const make = (type: string) => ({ children, ...props }: any) =>
    React.createElement(type, props, children);
    
  return {
    Gesture: {
      Pan: () => ({
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      }),
    },
    GestureDetector: make('GestureDetector'),
    GestureHandlerRootView: make('GestureHandlerRootView'),
  };
});

describe('BottomSheet UI', () => {
  it('deve renderizar o BottomSheet quando visível', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(BottomSheet, { visible: true, onClose: () => {} }));
    });
    expect(tree).toBeDefined();
  });
});
