// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // React Native Animated values are deliberately retained in refs and used by views.
      'react-hooks/refs': 'off',
      // Screen subscriptions reset local loading state when their route parameters change.
      'react-hooks/set-state-in-effect': 'off',
    },
  }
]);
