module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/__tests__/**/*.(test|spec).ts', '**/src/**/?(*.)(test|spec).ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};
