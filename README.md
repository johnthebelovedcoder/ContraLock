# ContraLock - Freelance Contract Escrow Platform

ContraLock is a milestone-based escrow platform for freelance payments, ensuring fair compensation for freelancers while protecting clients through transparent, milestone-based payment releases.

## Project Overview

This is a full-stack monorepo containing:

- **Frontend**: Next.js web application at `apps/web`
- **Backend API**: Express.js service at `apps/api`
- **AI Service**: AI microservice at `apps/ai-service`

## Architecture

The platform implements the requirements from the Product Requirements Document (PRD.md) and Functional Requirements Document (FRD.md), including:

- User authentication and management
- Project and milestone management
- Payment processing with Stripe
- Escrow functionality
- Dispute resolution system
- AI-powered features
- Admin dashboard

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Stripe account (for payment processing)
- OpenAI API key (for AI features)

### Setup Instructions

1. Clone the repository
2. Install dependencies in each app:
   ```bash
   cd apps/web && npm install
   cd ../api && npm install
   cd ../ai-service && npm install
   ```

3. Set up environment variables for each service (see CONFIGURATION.md)

4. Start services:
   - Start API service: `cd apps/api && npm run dev` (runs on port 3001, SQLite database will be created automatically)
   - Start AI service: `cd apps/ai-service && npm run dev` (runs on port 3002)
   - Start frontend: `cd apps/web && npm run dev` (runs on port 3000)

## API Documentation

The backend API is designed to match the frontend service expectations. See individual README files for detailed API documentation:

- [API Service Documentation](apps/api/README.md)
- [AI Service Documentation](apps/ai-service/README.md)

## Frontend Integration

The frontend is already implemented and expects API endpoints at:
- Authentication: `/auth/*` or `/api/v1/auth/*`
- Users: `/users/*` or `/api/v1/users/*`
- Projects: `/projects/*` or `/api/v1/projects/*`
- Milestones: `/milestones/*` or `/api/v1/milestones/*`
- Payments: `/payments/*` or `/api/v1/payments/*`
- Disputes: `/disputes/*` or `/api/v1/disputes/*`

The frontend is configured to connect to the backend API running at `http://localhost:3001` via the `NEXT_PUBLIC_API_URL` environment variable in the frontend's `.env.local` file.

## Running the Complete Application

1. Start the API service: `cd apps/api && npm run dev` (SQLite database will be created automatically)
2. Start the frontend: `cd apps/web && npm run dev`
3. Access the application at http://localhost:3000

## Key Features Implemented

1. **User Management**: Registration, login, profile management with email verification
2. **Project Management**: Creation, milestone tracking, status management
3. **Payment System**: Deposit, release, withdrawal, transaction history with Stripe integration
4. **Dispute Resolution**: Multi-phase system with mediation and arbitration
5. **AI Integration**: Smart milestone suggestions, deliverable verification, dispute analysis
6. **Security**: JWT authentication, input validation, rate limiting

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, SQLite, Sequelize
- **Payment Processing**: Stripe
- **AI**: OpenAI API
- **Authentication**: JWT with refresh tokens
- **Build Tool**: Turbo

## Configuration

For detailed configuration instructions, see [CONFIGURATION.md](CONFIGURATION.md).

## Development

This is a monorepo managed with pnpm and Turbo. You can run commands across all apps using:

```bash
# Run dev servers for all apps
npx turbo dev

# Build all apps
npx turbo build
```

## Code Quality & Maintenance

This repository includes automated tools to maintain code quality and prevent dead code:

```bash
# Run dead code detection
npm run knip

# Analyze potential cleanup opportunities
npm run cleanup:analyze

# View cleanup report
cat CLEANUP_REPORT.md
```

The repository also includes a GitHub Actions workflow that automatically detects dead code on pushes and pull requests.

## Environment Variables

Each service requires specific environment variables. See the individual `.env` files and the configuration guide for details.

## Next Steps

1. Set up Stripe for actual payment processing
2. Integrate a real OpenAI account for AI features
3. Deploy the services to production
4. Add comprehensive testing