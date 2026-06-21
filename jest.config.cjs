module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}]
  },
  testMatch: ['**/*.test.ts']
};
