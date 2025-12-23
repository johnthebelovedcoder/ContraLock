import { isMockDataEnabled } from './mock-config';

// Check if mock mode is enabled
export const isMockMode = isMockDataEnabled();

// Export other useful config functions
export { 
  mockConfig, 
  enableMockData, 
  disableMockData, 
  isMockDataEnabled 
} from './mock-config';