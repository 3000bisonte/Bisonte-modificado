module.exports = {
  extends: ['./config/build/.eslintrc.base.json'],
  ignorePatterns: [
    'scripts/**/*',
    'tests/__tests__/**/*', // Test files legacy
    'tests/e2e/**/*', // E2E tests con console.log permitidos
    'tests/integration/test-*.js', // Integration tests legacy
    'src/utils/logger.js', // Logger necesita console
  ],
  overrides: [
    {
      // Configuración específica para archivos de test Jest
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', 'tests/setup.js'],
      env: {
        jest: true,
        'jest/globals': true,
      },
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
      rules: {
        'no-undef': 'off', // Jest globals están disponibles
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en tests
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'import/no-unresolved': 'off', // Tests pueden usar path aliases no resueltos
        'no-console': 'off', // Permitir console.log en tests
      },
    },
  ],
};