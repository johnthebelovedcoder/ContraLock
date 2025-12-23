# ContraLock Error Handling System Documentation

## Overview

The ContraLock error handling system provides comprehensive error management for both frontend and backend applications. It consists of structured error classes, middleware for automatic error processing, user-friendly error display components, and unified error handling utilities.

## Architecture

### Backend Error Handling

#### Error Classes Hierarchy
```
AppError (Base Error)
├── BadRequestError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── ValidationError (422)
├── RateLimitError (429)
├── InternalServerError (500)
├── BadGatewayError (502)
├── ServiceUnavailableError (503)
├── EmailError
├── PaymentError
├── FileUploadError
└── DatabaseError
```

#### Middleware Components
- `asyncHandler.js`: Wraps async route handlers to automatically catch errors
- `errorHandler.js`: Global error handling middleware with centralized processing
- `logger.js`: Structured logging for error tracking and debugging

### Frontend Error Handling

#### Error Utilities
- `errorHandler.ts`: Core error handling functions and utilities
- API client integration with automatic error processing
- Store-level error handling integration

#### UI Components
- `error-boundary.tsx`: React error boundary for catching rendering errors
- `error-message.tsx`: Standard error message display
- `form-error.tsx`: Form-specific error display

## Backend Implementation

### Error Classes

Error classes are defined in `apps/api/src/errors/AppError.js`:

```javascript
// Example error class
class ValidationError extends AppError {
  constructor(message = 'Validation Error', errors = null) {
    super(message, 422);
    this.errors = errors;
  }
}
```

### Async Handler Middleware

Routes use the async handler to automatically catch errors:

```javascript
const asyncHandler = require('../middleware/asyncHandler');
const { ValidationError } = require('../errors/AppError');

router.post('/example', asyncHandler(async (req, res) => {
  // Business logic
  if (!isValid) {
    throw new ValidationError('Validation failed', validationErrors);
  }
  res.json({ success: true });
}));
```

### Error Handling Middleware

The global error handler in `apps/api/src/middleware/errorHandler.js` processes all errors:

- Logs errors with structured metadata
- Handles special cases (MongoDB, validation, etc.)
- Sends appropriate HTTP responses
- Maintains consistent error format

### Error Format

All error responses follow this format:
```json
{
  "status": "fail|error",
  "message": "Error message",
  "errors": [...], // For validation errors
  "stack": "..." // Only in development
}
```

## Frontend Implementation

### API Client Integration

The API client automatically processes errors:

```typescript
// apps/web/src/lib/api/client.ts
async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  try {
    return await this.client.get<T>(url, config);
  } catch (error) {
    const processedError = handleApiError(error);
    return Promise.reject(processedError);
  }
}
```

### Error Processing

The `handleApiError` function processes different error types:

- Network errors
- HTTP status codes (400-503)
- Unauthorized access (auto-logout)
- Validation errors

### Store Integration

Zustand stores integrate error handling:

```typescript
const message = getErrorMessage(error);
set({ error: message, loading: false });
```

### UI Components

- `ErrorBoundary`: Catches rendering errors
- `ErrorMessage`: Displays single error messages
- `FormError`: Displays multiple validation errors

## Usage Examples

### Backend Route with Error Handling

```javascript
const asyncHandler = require('../middleware/asyncHandler');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json({ user });
}));
```

### Frontend Error Handling in Components

```tsx
import { useEffect, useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import { useAuthStore } from '@/lib/store/authStore';

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const { user, error, initializeAuth } = useAuthStore();
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        await initializeAuth();
      } catch (err) {
        // Error is already handled by the store
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  // Render user profile
}
```

## Logging

Errors are logged to:
- `logs/error.log` - Error-level logs only
- `logs/combined.log` - All log levels
- Console - In development mode

Log format includes:
- Timestamp
- Error level
- Error message and stack trace
- Request metadata (path, method, IP, user agent)

## Testing

Error handling is tested with:
- Unit tests for error classes and utilities
- Integration tests for middleware
- API route error handling tests
- Frontend error handling tests

## Best Practices

### For Backend Development

1. Always use specific error classes instead of generic ones
2. Use `asyncHandler` to wrap all async route handlers
3. Provide meaningful error messages for better debugging
4. Include relevant context in error objects
5. Handle validation errors with `ValidationError` class

### For Frontend Development

1. Use the error handling utilities consistently
2. Display user-friendly error messages
3. Log errors for debugging but don't expose sensitive information
4. Clear errors when appropriate (e.g., form re-submission)
5. Use appropriate UI components for different error types

### Security Considerations

1. Don't expose internal error details in production
2. Use generic messages for authentication errors to prevent enumeration
3. Log sensitive error details but don't return them to clients
4. Handle unauthorized access by triggering logout

## Common Error Scenarios

### Validation Errors
- Status: 422
- Used for input validation failures
- Includes detailed field-specific errors

### Authentication Errors
- Status: 401
- Automatically handles logout and redirect
- Clears authentication tokens

### Authorization Errors
- Status: 403
- User is authenticated but lacks permissions

### Resource Not Found
- Status: 404
- Clean error for missing resources

### Server Errors
- Status: 500
- Generic server-side errors
- Logged for debugging but generic message to user

## Monitoring and Debugging

- All errors are logged with timestamps and context
- Error logs are stored in the `logs/` directory
- Structured logging enables easy parsing and analysis
- Development mode includes stack traces

This comprehensive error handling system ensures consistency, improves user experience, and simplifies debugging across the ContraLock application.