module.exports = {
  extends: ['./config/build/.eslintrc.base.json'],
  ignorePatterns: [
    'scripts/**/*',
    'tests/**/*', // Test suites fuera de la app
    'tests/__tests__/**/*', // Test files legacy
    'tests/e2e/**/*', // E2E tests con console.log permitidos
    'tests/integration/test-*.js', // Integration tests legacy
    'test-*.js', // Scripts de validación locales
    'verify-*.js',
    'verificar-*.js',
    'compare-*.js',
    'create-*.js',
    'debugging-*.js',
    'diagnose-*.js',
    'fix-*.js',
    'probar-*.js',
    'setup-*.js',
    'switch-*.js',
    'validate-*.js',
  'build-*.js',
  'check-*.js',
    'examples/**/*',
    'public/sw.js',
    'src/app/admin/test-session/**/*',
    'wdio.conf.js',
    'src/utils/logger.js', // Logger necesita console
  ],
  overrides: [
    {
      files: ['src/**/*.{js,jsx,ts,tsx}'],
      rules: {
        curly: 'off',
        'import/order': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-undef': 'off',
        'import/no-unresolved': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'no-console': 'off',
        'security/detect-object-injection': 'off',
        'security/detect-non-literal-regexp': 'off',
        '@next/next/no-img-element': 'off',
        'import/no-anonymous-default-export': 'off',
        'no-prototype-builtins': 'off',
        'no-unused-expressions': 'off',
        'prefer-const': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        'react/no-unescaped-entities': 'off',
      },
    },
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