jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
    multiRemove: jest.fn(async () => undefined),
  },
}));

// Avoid the expo-font -> expo-asset -> expo-modules-core native chain in tests.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = (props) => React.createElement(Text, props, props.name || '');
  const make = () => MockIcon;
  return new Proxy({}, {
    get: (_t, prop) => (prop === '__esModule' ? true : make()),
  });
});


jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => insets,
    useFrame: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  };
});
