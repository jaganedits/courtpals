import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Stub lib/firebase so tests don't pull in the real Node platform build
    // of firebase/auth (which requires a global fetch polyfill).
    '^@/lib/firebase$': '<rootDir>/__mocks__/firebase.ts',
    // Stub the direct firebase/firestore import in hooks to avoid loading it
    // at all. The stub exposes only the top-level helpers we import.
    '^firebase/firestore$': '<rootDir>/__mocks__/firebase-firestore.ts',
    '^firebase/auth$': '<rootDir>/__mocks__/firebase-auth.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
}

export default config
