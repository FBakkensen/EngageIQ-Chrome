// jest.config.js
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/mocks/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/mocks/fileMock.js',
  },
  projects: [
    {
      displayName: 'DOM',
      testMatch: ['<rootDir>/src/**/*.spec.tsx', '<rootDir>/tests/ui/**/*.test.ts?(x)'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup-dom.js'],
    },
    {
      displayName: 'NODE',
      testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/tests/services/**/*.test.ts', '<rootDir>/tests/setup.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup-node.js'],
    },
  ],
  // Coverage collection configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.{spec,test}.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/index.ts',
    '!src/background.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70
    }
  },
  // Test reporting configuration
  testTimeout: 10000,
  verbose: true
}; 