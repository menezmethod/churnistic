/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@testing-library/jest-dom$': '<rootDir>/node_modules/@testing-library/jest-dom',
    '^@testing-library/jest-dom/extend-expect$':
      '<rootDir>/node_modules/@testing-library/jest-dom',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        useESM: true,
      },
    ],
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: ['next/babel'],
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jose|firebase-admin|jwks-rsa|@firebase|firebase|next|@trpc)/)',
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/types/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    './src/server/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/app/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/components/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/utils/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};

module.exports = config;
