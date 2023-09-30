module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'js'],
  transformIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: ['src/**/*.{js,ts}', '!<rootDir>/node_modules/'],
  coverageThreshold: {
    global: {
      branches: 84,
      functions: 90,
      lines: 91,
      statements: 92,
    },
  },
  coverageReporters: ['text'],
};
