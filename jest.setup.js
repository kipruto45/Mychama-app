/* eslint-env jest */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Avoid pulling in Expo native modules in unit tests (icons depend on expo-font/expo-modules-core).
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const Icon = ({ name, ...props }) => React.createElement(Text, props, name);

  return {
    MaterialCommunityIcons: Icon,
  };
});

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MaterialCommunityIcon = ({ name, ...props }) => React.createElement(Text, props, name);
  MaterialCommunityIcon.displayName = 'MaterialCommunityIcon';
  return MaterialCommunityIcon;
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
