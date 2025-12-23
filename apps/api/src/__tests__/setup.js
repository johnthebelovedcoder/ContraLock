/**
 * Test setup file for Jest
 * Sets up global mocks and configurations
 */

// Mock global environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-client-id';
process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-client-secret';
process.env.STRIPE_SECRET_KEY = 'test-stripe-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock console methods to suppress logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Set up global variables or configurations
beforeAll(() => {
  // Any setup that needs to run once before all tests
  console.log('Global test setup completed');
});

beforeEach(() => {
  // Any setup that needs to run before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Any cleanup that needs to run after each test
  jest.restoreAllMocks();
});

afterAll(() => {
  // Any cleanup that needs to run once after all tests
  console.log('Global test cleanup completed');
});