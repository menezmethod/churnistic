const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^jose/(.*)$': '<rootDir>/node_modules/jose/dist/node/cjs/$1',
    '^firebase-admin/auth$': '<rootDir>/src/lib/auth/__mocks__/firebase-admin.ts',
    '^next/server$': '<rootDir>/node_modules/next/dist/server/web/exports/index.js',
    '^jwks-rsa$': '<rootDir>/node_modules/jwks-rsa/src/index.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@firebase|firebase|firebase-admin|@trpc|superjson|@babel|@jest|jest-runtime|next/dist/compiled|@swc/helpers|@babel/runtime/helpers/esm|uuid|jwks-rsa)/)',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
  resolver: '<rootDir>/jest.resolver.js',
};

module.exports = createJestConfig(customJestConfig);
