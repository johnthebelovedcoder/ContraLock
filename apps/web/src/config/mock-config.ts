// Configuration for mock data usage
// This file provides configuration for using mock data in development

export const mockConfig = {
  // Whether to use mock data instead of real API
  useMockData: typeof window !== 'undefined'
    ? localStorage.getItem('useMockData') === 'true' ||
      process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
      process.env.NODE_ENV === 'development' // Enable by default in development
    : process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
      process.env.NODE_ENV === 'development', // Enable by default in development

  // Delay for mock API calls to simulate network latency
  mockDelay: 500,

  // Toggle for enabling/disabling specific mock features
  features: {
    projects: true,
    milestones: true,
    transactions: true,
    notifications: true,
    payments: true,
    disputes: true,
    users: true,
    messaging: true, // Added messaging to the features
  },

  // Debug mode for mock data
  debug: typeof window !== 'undefined'
    ? process.env.NODE_ENV === 'development'
    : false,
};

// Function to enable mock data
export const enableMockData = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useMockData', 'true');
    window.location.reload();
  }
};

// Function to disable mock data
export const disableMockData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('useMockData');
    window.location.reload();
  }
};

// Function to check if mock data is enabled
export const isMockDataEnabled = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('useMockData') === 'true' || mockConfig.useMockData;
  }
  return mockConfig.useMockData;
};