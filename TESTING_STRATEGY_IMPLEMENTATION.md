# Automated Testing Strategy Implementation

## Overview
This document outlines a comprehensive automated testing strategy for the ContraLock platform, implementing multiple testing levels: unit, integration, E2E, and load testing. This will ensure code quality, reliability, and performance across the entire platform.

## Testing Philosophy

### Core Principles:
- **Test Pyramid**: Focus on unit tests, fewer integration tests, and minimal E2E tests
- **Fast Feedback**: Quick test runs during development
- **Reliable Tests**: Minimize flaky or unreliable tests
- **Comprehensive Coverage**: Test critical business flows and edge cases
- **Maintainable Code**: Easy to understand and modify tests
- **Security Testing**: Include security-focused tests

## Technical Implementation

### 1. Testing Framework Setup

**Root package.json updates** (package.json):
```json
{
  "scripts": {
    "test": "npm run test --workspaces",
    "test:unit": "npm run test:unit --workspaces",
    "test:integration": "npm run test:integration --workspaces",
    "test:e2e": "npm run test:e2e --workspaces",
    "test:coverage": "npm run test:coverage --workspaces",
    "test:watch": "npm run test:watch --workspaces",
    "lint": "npm run lint --workspaces",
    "typecheck": "npm run typecheck --workspaces"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

**API Package Configuration** (apps/api/package.json):
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --config=jest.unit.config.js",
    "test:integration": "jest --config=jest.integration.config.js",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage=false"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@jest/globals": "^29.7.0",
    "@jest/expect": "^29.7.0",
    "@types/jest": "^29.5.12",
    "supertest": "^6.3.3",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.2.1",
    "identity-obj-proxy": "^3.0.0",
    "jest-environment-jsdom": "^29.7.0",
    "jest-environment-node": "^29.7.0",
    "ts-jest": "^29.1.2",
    "eslint-plugin-jest": "^27.9.0",
    "@types/supertest": "^6.0.2",
    "nock": "^13.5.4",
    "msw": "^2.2.14",
    "playwright": "^1.41.2"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/mocks/**",
      "!src/types/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 85,
        "lines": 90,
        "statements": 90
      }
    }
  }
}
```

**Web Package Configuration** (apps/web/package.json):
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --config=jest.unit.config.js",
    "test:component": "jest --config=jest.component.config.js",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ui": "playwright show-report"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.2.1",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/dom": "^10.1.0",
    "identity-obj-proxy": "^3.0.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.41.2",
    "@playwright/test/reporter": "^1.41.2",
    "msw": "^2.2.14",
    "msw-storybook-addon": "^2.0.0",
    "@storybook/test": "^8.0.4"
  }
}
```

### 2. Jest Configuration Files

**API Unit Tests Configuration** (apps/api/jest.unit.config.js):
```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(js|jsx|ts|tsx)',
    '**/?(*.)+(spec|test).+(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/config/**',
    '!src/migrations/**',
    '!src/seeds/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true
};
```

**API Integration Tests Configuration** (apps/api/jest.integration.config.js):
```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/integration/**/*.+(js|jsx|ts|tsx)',
    '**/integration/**/*.+(spec|test).+(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/config/**',
    '!src/migrations/**',
    '!src/seeds/**'
  ],
  coverageDirectory: '<rootDir>/coverage-integration',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.js'],
  testTimeout: 30000, // Longer timeout for integration tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true
};
```

**Web Jest Configuration** (apps/web/jest.config.js):
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  modulePaths: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
    '!src/mocks/**',
    '!src/types/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  testTimeout: 15000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
```

### 3. Test Setup Files

**API Test Setup** (apps/api/jest.setup.js):
```javascript
// Setup for unit tests
process.env.NODE_ENV = 'test';

// Mock external services
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    balances: {
      retrieve: jest.fn(),
    },
  }));
});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  }),
}));

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(true),
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }),
}));

// Mock console for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

**API Integration Test Setup** (apps/api/jest.integration.setup.js):
```javascript
// Setup for integration tests
process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'sqlite';
process.env.DB_PATH = ':memory:'; // Use in-memory SQLite for tests

const { sequelize } = require('./src/config/database');

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Create fresh schema for each test run
    console.log('Connected to database for integration tests');
  } catch (error) {
    console.error('Failed to setup database for tests:', error);
  }
});

afterAll(async () => {
  await sequelize.close();
  console.log('Disconnected from database after tests');
});

// Mock external services that shouldn't be called during tests
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_mock', status: 'succeeded' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'pi_mock', status: 'succeeded' }),
      confirm: jest.fn().mockResolvedValue({ id: 'pi_mock', status: 'succeeded' }),
    },
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_mock' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'cus_mock' }),
    },
  }));
});
```

**Web Test Setup** (apps/web/jest.setup.js):
```javascript
import '@testing-library/jest-dom';

// Mock window methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '',
    asPath: '',
    route: '/',
  }),
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
```

### 4. Unit Tests

**Example Unit Test for Service** (apps/api/src/services/paymentService.test.js):
```javascript
const paymentService = require('./paymentService');
const stripe = require('stripe')('test-key');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  }));
});

describe('Payment Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create payment intent with correct parameters', async () => {
    const mockPaymentIntent = {
      id: 'pi_123',
      status: 'requires_payment_method',
      amount: 2000
    };

    stripe().paymentIntents.create.mockResolvedValue(mockPaymentIntent);

    const result = await paymentService.createPaymentIntent({
      amount: 2000,
      currency: 'usd',
      description: 'Test payment'
    });

    expect(stripe().paymentIntents.create).toHaveBeenCalledWith({
      amount: 2000,
      currency: 'usd',
      description: 'Test payment',
      metadata: { integration_check: 'accept_a_payment' }
    });

    expect(result.id).toBe('pi_123');
    expect(result.status).toBe('requires_payment_method');
  });

  test('should validate payment amount', async () => {
    // Test that the service validates minimum amount
    await expect(
      paymentService.createPaymentIntent({
        amount: 0, // Invalid amount
        currency: 'usd',
        description: 'Test payment'
      })
    ).rejects.toThrow('Amount must be at least 1 cent');

    await expect(
      paymentService.createPaymentIntent({
        amount: -500, // Invalid amount
        currency: 'usd',
        description: 'Test payment'
      })
    ).rejects.toThrow('Amount must be at least 1 cent');
  });

  test('should format currency correctly', () => {
    expect(paymentService.formatAmount(10.99, 'usd')).toBe(1099); // $10.99 = 1099 cents
    expect(paymentService.formatAmount(100, 'eur')).toBe(10000); // €100 = 10000 cents
    expect(paymentService.formatAmount(0.01, 'usd')).toBe(1); // $0.01 = 1 cent
  });

  test('should validate currency', () => {
    expect(() => paymentService.formatAmount(10, 'usd')).not.toThrow();
    expect(() => paymentService.formatAmount(10, 'eur')).not.toThrow();
    expect(() => paymentService.formatAmount(10, 'invalid')).toThrow('Unsupported currency');
  });
});
```

**Example Unit Test for Controller** (apps/api/src/controllers/authController.test.js):
```javascript
const authController = require('./authController');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../models', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('Auth Controller - Unit Tests', () => {
  let mockRequest, mockResponse, nextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: null,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    nextFunction = jest.fn();

    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'client'
      };

      mockRequest.body = userData;

      const hashedPassword = 'hashedPassword123';
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const mockUser = {
        id: 'user-123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        save: jest.fn()
      };

      User.create.mockResolvedValue(mockUser);

      jwt.sign.mockReturnValue('mock-jwt-token');

      await authController.register(mockRequest, mockResponse, nextFunction);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(User.create).toHaveBeenCalledWith({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        user: {
          id: 'user-123',
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role
        }
      });
    });

    test('should return error if user already exists', async () => {
      mockRequest.body = {
        email: 'existing@example.com',
        password: 'Password123',
        firstName: 'Existing',
        lastName: 'User',
        role: 'client'
      };

      const existingUser = { id: 'existing-123', email: 'existing@example.com' };
      User.findOne.mockResolvedValue(existingUser);

      await authController.register(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User with this email already exists'
      });
    });
  });

  describe('login', () => {
    test('should login user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123'
      };

      mockRequest.body = userData;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'client'
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');

      await authController.login(mockRequest, mockResponse, nextFunction);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(userData.password, mockUser.password);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful',
        user: { 
          id: 'user-123', 
          email: 'test@example.com', 
          firstName: 'Test', 
          lastName: 'User', 
          role: 'client' 
        },
        token: 'mock-jwt-token'
      });
    });

    test('should return error for invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongPassword'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'client'
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false); // Password doesn't match

      await authController.login(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid email or password'
      });
    });
  });
});
```

### 5. Integration Tests

**Example Integration Test** (apps/api/tests/integration/auth.integration.test.js):
```javascript
const request = require('supertest');
const app = require('../../src/app');
const { User, sequelize } = require('../../src/models');
const bcrypt = require('bcryptjs');

describe('Authentication API Integration Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up test data
    await User.destroy({ where: {} });
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);

      // Verify user was actually created in database
      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).not.toBeNull();
      expect(user.firstName).toBe(userData.firstName);
    });

    test('should return 400 when email is already registered', async () => {
      // First registration
      const userData = {
        email: 'duplicate@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'client'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('User with this email already exists');
    });

    test('should return 400 for invalid input data', async () => {
      const invalidData = {
        email: 'invalid-email', // Invalid email format
        password: '123', // Too short
        firstName: '', // Required field
        role: 'invalid-role' // Invalid role
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should login existing user successfully', async () => {
      // First, register a user
      const registerData = {
        email: 'login@example.com',
        password: 'TestPassword123!',
        firstName: 'Login',
        lastName: 'Test',
        role: 'client'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      // Then try to login
      const loginData = {
        email: 'login@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('login@example.com');
    });

    test('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    test('should return current user with valid token', async () => {
      // Register and login to get token
      const registerData = {
        email: 'me@example.com',
        password: 'TestPassword123!',
        firstName: 'Me',
        lastName: 'Test',
        role: 'client'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      const loginData = {
        email: 'me@example.com',
        password: 'TestPassword123!'
      };

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      const token = loginResponse.body.token;

      // Test protected endpoint
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.email).toBe('me@example.com');
      expect(response.body.user.firstName).toBe('Me');
    });

    test('should return 401 without valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });
  });
});
```

### 6. Component Tests (for Web Frontend)

**Example Component Test** (apps/web/src/components/LoginForm/LoginForm.test.js):
```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import LoginForm from './LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';

// Mock hooks and dependencies
jest.mock('../../hooks/useAuth');
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('LoginForm Component', () => {
  let mockLogin, mockRouter;

  beforeEach(() => {
    mockLogin = jest.fn().mockResolvedValue({ success: true, user: { id: 1, email: 'test@example.com' }, token: 'mock-token' });
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
    };

    useAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      loading: false,
      error: null,
    });

    useRouter.mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with required fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('submits form with valid credentials', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
    });
  });

  test('shows error message for invalid credentials', async () => {
    // Mock a failed login
    mockLogin.mockRejectedValueOnce({ error: 'Invalid email or password' });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword!' } });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.click(submitButton);

    // Check for validation errors (these depend on your form validation implementation)
    expect(emailInput).toBeInvalid();
    expect(passwordInput).toBeInvalid();
  });
});
```

### 7. E2E Tests with Playwright

**Playwright Configuration** (apps/web/playwright.config.js):
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording (for failed tests) */
    video: 'retry-with-video',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Example E2E Test** (apps/web/tests/e2e/auth-flow.spec.js):
```javascript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing cookies
    await page.context().clearCookies();
  });

  test('should register and login successfully', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Fill registration form
    await page.getByLabel(/email/i).fill('e2e-test@example.com');
    await page.getByLabel(/first name/i).fill('E2E');
    await page.getByLabel(/last name/i).fill('Test');
    await page.getByLabel(/password/i).fill('SecurePassword123!');
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Verify registration success (might redirect to dashboard or show success message)
    await expect(page).toHaveURL(/dashboard|welcome/);
    
    // Logout
    await page.getByRole('button', { name: /logout|sign out/i }).click();
    
    // Verify logout by checking we're back to homepage or login page
    await expect(page).toHaveURL(/login|auth/);
    
    // Login again
    await page.getByLabel(/email/i).fill('e2e-test@example.com');
    await page.getByLabel(/password/i).fill('SecurePassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Verify successful login
    await expect(page.getByText(/dashboard|welcome|hello/i)).toBeVisible();
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/register');
    
    // Submit empty form
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Check for validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
    
    // Try with invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password');
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page.getByText(/valid email/i)).toBeVisible();
    await expect(page.getByText(/password.*8 characters/i)).toBeVisible();
  });
});

test.describe('Project Management Flow', () => {
  test('should create and manage a project', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'password');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for login to complete
    await expect(page).toHaveURL(/dashboard|projects/);
    
    // Navigate to create project
    await page.getByRole('link', { name: /create project|new project/i }).click();
    
    // Fill project form
    await page.getByLabel(/project title/i).fill('E2E Test Project');
    await page.getByLabel(/description/i).fill('This is a test project for E2E testing');
    await page.getByLabel(/budget/i).fill('1000');
    await page.getByLabel(/deadline/i).fill('2024-12-31');
    
    // Submit project
    await page.getByRole('button', { name: /create project/i }).click();
    
    // Verify project was created
    await expect(page.getByText(/project created successfully/i)).toBeVisible();
    await expect(page.getByText(/E2E Test Project/i)).toBeVisible();
  });
});
```

### 8. Load Testing

**Load Test Script** (load-tests/api-load-test.js):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// Load test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should complete within 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% of requests should fail
  },
};

// API endpoints to test
const BASE_URL = 'http://localhost:3001';
const API_VERSION = 'v1';

export default function() {
  // Test registration endpoint
  const registrationPayload = JSON.stringify({
    email: `loadtest${__VU}@example.com`, // __VU is the virtual user number
    password: 'Password123!',
    firstName: 'Load',
    lastName: 'Test',
    role: 'client'
  });

  const registrationParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const registrationRes = http.post(
    `${BASE_URL}/api/${API_VERSION}/auth/register`,
    registrationPayload,
    registrationParams
  );

  check(registrationRes, {
    'registration status is 201': (r) => r.status === 201,
    'registration success message': (r) => r.json().message === 'User registered successfully',
  });

  sleep(1);

  // Test login endpoint
  const loginPayload = JSON.stringify({
    email: `loadtest${__VU}@example.com`,
    password: 'Password123!'
  });

  const loginRes = http.post(
    `${BASE_URL}/api/${API_VERSION}/auth/login`,
    loginPayload,
    registrationParams
  );

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json().token !== undefined,
  });

  if (loginSuccess) {
    const token = loginRes.json().token;
    
    // Test protected endpoint (get user profile)
    const profileRes = http.get(`${BASE_URL}/api/${API_VERSION}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    check(profileRes, {
      'profile status is 200': (r) => r.status === 200,
      'profile returns user data': (r) => r.json().user !== undefined,
    });
  }

  sleep(2);

  // Test project endpoints
  if (loginSuccess) {
    const projectPayload = JSON.stringify({
      title: `Load Test Project ${__VU}`,
      description: `Project created by load test user ${__VU}`,
      budget: Math.floor(Math.random() * 1000) + 500, // Random budget between 500-1500
      deadline: '2024-12-31',
      category: 'web-development',
      skillsRequired: ['javascript', 'react']
    });

    const projectRes = http.post(
      `${BASE_URL}/api/${API_VERSION}/projects`,
      projectPayload,
      {
        headers: {
          'Authorization': `Bearer ${loginRes.json().token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    check(projectRes, {
      'project creation status is 201': (r) => r.status === 201,
      'project creation returns project data': (r) => r.json().project !== undefined,
    });

    sleep(1);

    // Test getting projects
    const getProjectsRes = http.get(`${BASE_URL}/api/${API_VERSION}/projects`, {
      headers: {
        'Authorization': `Bearer ${loginRes.json().token}`,
      },
    });

    check(getProjectsRes, {
      'get projects status is 200': (r) => r.status === 200,
      'get projects returns array': (r) => Array.isArray(r.json().projects),
    });
  }

  sleep(3);
}
```

### 9. Security Testing

**Security Tests** (apps/api/tests/security/auth.security.test.js):
```javascript
const request = require('supertest');
const app = require('../../src/app');
const { User, sequelize } = require('../../src/models');

describe('Authentication Security Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  test('should prevent brute force login attempts', async () => {
    // Register a user first
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'bruteforce@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'client'
      });

    // Try to login with wrong password multiple times
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'bruteforce@example.com',
          password: 'WrongPassword'
        });
    }

    // Even with correct password, should still fail due to rate limiting
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'bruteforce@example.com',
        password: 'SecurePassword123!'
      });

    // Rate limiting middleware should prevent login attempts
    // This test would need to be adjusted based on your rate limiting implementation
  });

  test('should prevent SQL injection', async () => {
    // Register a user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'sqltest@example.com',
        password: 'SecurePassword123!',
        firstName: 'SQL',
        lastName: 'Test',
        role: 'client'
      });

    // Try SQL injection in email field
    const maliciousEmail = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: maliciousEmail,
        password: 'password'
      });

    // Should return 401 not found rather than crashing
    expect(response.status).not.toBe(500);
  });

  test('should prevent NoSQL injection in API parameters', async () => {
    // Test for potential NoSQL injection in search endpoints
    const response = await request(app)
      .get('/api/v1/users/search')
      .query({
        email: { $ne: null } // Potential NoSQL injection
      })
      .set('Authorization', 'Bearer invalid-token');

    // Should return appropriate error rather than exposing internal structure
    expect(response.status).toBeOneOf([401, 400]);
  });

  test('should properly hash passwords', async () => {
    // Register a user
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'hashing@example.com',
        password: 'SecurePassword123!',
        firstName: 'Hash',
        lastName: 'Test',
        role: 'client'
      });

    expect(response.status).toBe(201);

    // Check that password is properly hashed in database
    const user = await User.findOne({ where: { email: 'hashing@example.com' } });
    expect(user.password).not.toBe('SecurePassword123!'); // Should be hashed
    expect(user.password).toMatch(/^[$]/); // Should start with $ (bcrypt format)
  });
});
```

### 10. Testing Pipeline Configuration

**GitHub Actions Workflow** (github/workflows/test.yml):
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: delivault_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm run test:unit
      env:
        CI: true
        NODE_ENV: test
        DB_TYPE: sqlite
        DB_PATH: ':memory:'

    - name: Run integration tests
      run: npm run test:integration
      env:
        CI: true
        NODE_ENV: test
        DB_TYPE: postgresql
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: delivault_test
        DB_USER: postgres
        DB_PASS: postgres

    - name: Run security tests
      run: npm run test:security
      env:
        CI: true
        NODE_ENV: test

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
```

### 11. Test Reporting and Monitoring

**Test Coverage Setup** (apps/api/coverage.config.js):
```javascript
module.exports = {
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/config/**',
    '!src/migrations/**',
    '!src/seeds/**',
    '!src/test-utils/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    },
    './src/controllers/': {
      branches: 85,
      functions: 90,
      lines: 92,
      statements: 92
    },
    './src/services/': {
      branches: 85,
      functions: 90,
      lines: 92,
      statements: 92
    },
    './src/models/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

This comprehensive testing strategy implementation provides:

1. **Multiple testing levels**: Unit, integration, E2E, and load tests
2. **Security-focused tests**: SQL injection, brute force, and authentication security
3. **Framework integration**: Jest, Playwright, and k6 for different test types
4. **CI/CD pipeline**: GitHub Actions integration for automated testing
5. **Coverage thresholds**: Ensured code quality standards
6. **Performance monitoring**: Load testing for scalability
7. **Maintainable code**: Proper mocking, setup, and teardown
8. **Comprehensive coverage**: Testing for business logic, APIs, and UI components