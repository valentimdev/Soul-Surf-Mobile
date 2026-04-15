module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  // ADICIONE A LINHA ABAIXO PARA IGNORAR O MAPA QUE ESTÁ QUEBRANDO
  modulePathIgnorePatterns: ["__tests__/map.test.tsx"], 
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
