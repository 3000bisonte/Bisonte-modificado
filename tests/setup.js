// Test setup for Jest

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'loading' }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Setup test environment
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
