/**
 * Jest Test Setup
 * Configuración global para todas las pruebas
 */

// Suprimir warnings innecesarios en tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'loading' })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { eslint, ...rest } = props;
    return { type: 'img', props: rest };
  },
}));

// Setup test environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/bisonte_test';

// Global test utilities
global.mockFetch = (response, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      status: ok ? 200 : 400,
    })
  );
};

global.mockFetchError = (error) => {
  global.fetch = jest.fn(() => Promise.reject(error));
};
