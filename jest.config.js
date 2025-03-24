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
}; 