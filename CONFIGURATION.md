# ContraLock - Full Stack Configuration

## Project Structure
- `apps/web` - Frontend Next.js application
- `apps/api` - Backend API service
- `apps/ai-service` - AI microservice

## Backend Setup

### API Service
1. Navigate to the API directory:
```bash
cd apps/api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
PORT=3001
DB_TYPE=sqlite
DB_PATH=./data/contralock.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
OPENAI_API_KEY=your-openai-api-key
```

4. Run the API service:
```bash
npm run dev
```

### AI Service
1. Navigate to the AI service directory:
```bash
cd apps/ai-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
PORT=3002
OPENAI_API_KEY=your-openai-api-key
```

4. Run the AI service:
```bash
npm run dev
```

## Frontend Setup

1. Navigate to the web directory:
```bash
cd apps/web
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

4. Run the frontend:
```bash
npm run dev
```

## Important Notes

- The frontend expects the backend API to be running on port 3001
- The backend API routes are designed to match the frontend service expectations
- All API routes are available with versioning at `/api/v1/auth`, `/api/v1/users`, `/api/v1/projects`, etc.
- For backward compatibility, routes are also available without versioning at `/auth`, `/users`, `/projects`, etc.
- The frontend uses `NEXT_PUBLIC_API_URL` to determine where to send API requests
- No external database server required - using SQLite file-based database

## Development Workflow

1. Start the API service on port 3001 (SQLite database will be created automatically)
2. Start the AI service on port 3002
3. Start the frontend on port 3000
4. Access the application at http://localhost:3000