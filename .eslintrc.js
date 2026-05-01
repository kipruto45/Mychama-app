module.exports = {
  root: true,
  extends: ['expo'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
  overrides: [
    {
      files: ['*.config.js', '.eslintrc.js', 'metro.config.js'],
      env: {
        node: true,
      },
    },
  ],
};
