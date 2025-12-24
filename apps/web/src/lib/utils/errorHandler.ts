// apps/web/src/lib/utils/errorHandler.ts
export interface ErrorData {
  message: string;
  status?: number;
  details?: any;
}

export class FrontendError extends Error {
  status?: number;
  details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'FrontendError';
    this.status = status;
    this.details = details;
  }
}

// Error handling utility functions
export const handleApiError = (error: any): ErrorData => {
  // Handle network errors
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection.',
      details: error.message
    };
  }

  // Handle specific HTTP status codes
  const { status, data } = error.response;

  switch (status) {
    case 400:
      return {
        message: data.message || 'Bad request',
        status,
        details: data.errors || data
      };
    
    case 401:
      // Handle unauthorized access
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
      return {
        message: 'Session expired. Please log in again.',
        status
      };
    
    case 403:
      return {
        message: data.message || 'Access forbidden',
        status
      };
    
    case 404:
      return {
        message: data.message || 'Resource not found',
        status
      };
    
    case 409:
      return {
        message: data.message || 'Conflict occurred',
        status
      };
    
    case 422:
      return {
        message: data.message || 'Validation error',
        status,
        details: data.errors
      };
    
    case 429:
      return {
        message: data.message || 'Too many requests. Please try again later.',
        status
      };
    
    case 500:
      return {
        message: data.message || 'Internal server error',
        status
      };
    
    case 502:
      return {
        message: data.message || 'Bad gateway. Please try again later.',
        status
      };
    
    case 503:
      return {
        message: data.message || 'Service unavailable. Please try again later.',
        status
      };
    
    default:
      return {
        message: data.message || 'An unexpected error occurred',
        status
      };
  }
};

// Error display utility
export const getErrorMessage = (error: any): string => {
  if (error instanceof FrontendError) {
    return error.message;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// Format validation errors
export const formatValidationErrors = (errors: any): string[] => {
  if (!errors) return [];

  if (Array.isArray(errors)) {
    return errors.map((error: any) => error.msg || error.message || 'Validation error');
  }

  if (typeof errors === 'object') {
    return Object.values(errors).flat().map((error: any) => 
      error.msg || error.message || 'Validation error'
    );
  }

  return ['Validation error'];
};

// Log error for debugging
export const logError = (error: any, context?: string): void => {
  const errorInfo: Record<string, any> = {};

  try {
    // Add basic error info
    if (error && typeof error === 'object') {
      if (error.message) errorInfo.message = error.message;
      if (error.stack) errorInfo.stack = error.stack;

      // Add response data if available
      if (error.response) {
        errorInfo.response = {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        };
      }

      // Add request data if available
      if (error.request || error.config) {
        errorInfo.request = {
          method: error.config?.method,
          url: error.config?.url,
          data: error.config?.data
        };
      }
    } else {
      // Handle non-object errors (strings, numbers, etc.)
      errorInfo.message = String(error);
    }

    // Add timestamp and context
    errorInfo.timestamp = new Date().toISOString();
    if (context) {
      errorInfo.context = context;
    }
  } catch (e) {
    // If there's an error processing the error object, log a generic message
    errorInfo.message = 'Error occurred while processing error object';
    errorInfo.originalError = String(error);
    errorInfo.processingError = String(e);
  }

  console.error(`[Error${context ? ` - ${context}` : ''}]`, errorInfo);
};

// Handle error in UI context
export const showErrorToast = (error: any, fallbackMessage: string = 'An error occurred'): void => {
  const errorMessage = getErrorMessage(error) || fallbackMessage;
  // Assuming you're using a toast library like react-hot-toast or similar
  // For now, we'll just log it or use browser alert
  console.error('Error:', errorMessage);
  // In a real implementation, you would use toast.error(errorMessage);
};