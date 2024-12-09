module.exports = {
  env: {
    node: true,
    jest: true,
    es6: true,
  },
  extends: ['eslint:recommended'],
  rules: {
    // Add any specific rules for your project
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};