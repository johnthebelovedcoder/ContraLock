# ContraLock Development Setup

This guide helps you set up the ContraLock platform for development.

## Prerequisites

- Node.js v18+ installed
- pnpm installed (`npm install -g pnpm`)

## Setup Instructions

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:

### For API Service:
```bash
cd apps/api
cp .env.example .env  # or rename .env.example to .env
```

Edit the `.env` file with your configuration:
```env
PORT=3001
DB_TYPE=sqlite
DB_PATH=./data/contralock.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
OPENAI_API_KEY=your-openai-api-key
```

### For Frontend:
```bash
cd apps/web
cp .env.local.example .env.local  # or rename .env.local.example to .env.local
```

Edit the `.env.local` file with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-in-production
```

## Running the Application

### Option 1: Run services separately

1. Start the API service in one terminal (SQLite database will be created automatically):
```bash
cd apps/api
npm run dev
```

2. Start the AI service in another terminal (if needed):
```bash
cd apps/ai-service
npm run dev
```

3. Start the frontend in another terminal:
```bash
cd apps/web
npm run dev
```

### Option 2: Run with Turbo (recommended for development)
```bash
pnpm dev
```

## Accessing the Application

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Documentation: http://localhost:3001/api/v1 (returns available endpoints)
- API Health Check: http://localhost:3001/health
- API Stats: http://localhost:3001/stats

## Environment Variables Explanation

### API Service (.env)
- `PORT`: Port for the API server (default: 3001)
- `DB_TYPE`: Database type (sqlite)
- `DB_PATH`: Path to SQLite database file (default: ./data/contralock.sqlite)
- `JWT_SECRET`: Secret for JWT token signing
- `REFRESH_TOKEN_SECRET`: Secret for refresh token signing
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `LOG_LEVEL`: Logging level (info, warn, error)
- `RATE_LIMIT_WINDOW_MS`: Time window for rate limiting (default: 900000ms = 15 min)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window for general endpoints
- `AUTH_RATE_LIMIT_MAX_REQUESTS`: Max requests per window for auth endpoints

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Base URL for API calls (should point to your API server)
- `NEXTAUTH_URL`: NextAuth base URL
- `NEXTAUTH_SECRET`: NextAuth secret key

## Verification Steps

1. Start all services
2. Visit http://localhost:3000 - you should see the frontend
3. Try registering a new account - this should connect to the backend
4. Check the browser network tab to verify API requests are going to http://localhost:3001
5. Check the API server console for incoming requests
6. Check the logs directory for application logs

## Troubleshooting

### Frontend can't connect to backend:
- Make sure API service is running on port 3001
- Verify NEXT_PUBLIC_API_URL in frontend .env.local points to http://localhost:3001
- Check browser console for CORS errors

### Database connection issues:
- Verify DB_TYPE and DB_PATH in API .env file
- Check that the data directory exists and is writable
- Check API server console for database connection errors

### Authentication issues:
- Verify JWT secrets are consistent between services
- Make sure tokens are properly stored in browser localStorage