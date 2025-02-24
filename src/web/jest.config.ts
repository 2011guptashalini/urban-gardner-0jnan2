import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // Use jsdom environment for React component testing
  testEnvironment: 'jsdom',

  // Define root directory for test discovery
  roots: ['<rootDir>/src'],

  // Setup files for testing utilities and custom configurations
  setupFilesAfterEnv: [
    '@testing-library/jest-dom/extend-expect',
    '<rootDir>/src/setupTests.ts'
  ],

  // Module path aliases and file mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.ts',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1'
  },

  // TypeScript and asset transformation configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        isolatedModules: true
      }
    ],
    '^.+\\.svg$': 'jest-transform-stub'
  },

  // Test file pattern matching
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',

  // Supported file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage collection configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__mocks__/**',
    '!src/**/index.{ts,tsx}',
    '!src/types/**',
    '!src/constants/**'
  ],

  // Strict coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    'src/components/**/*.{ts,tsx}': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/utils/**/*.{ts,tsx}': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Coverage report output directory
  coverageDirectory: '<rootDir>/coverage',

  // Verbose output for better debugging
  verbose: true,

  // Extended timeout for complex component tests
  testTimeout: 10000,

  // Mock configuration
  clearMocks: true,
  restoreMocks: true
};

export default config;