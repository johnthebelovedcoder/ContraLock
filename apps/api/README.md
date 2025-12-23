# Delivault API Service

This is the backend API service for the Delivault escrow platform.

## Features

### Core Functionality
- User authentication and management
- Project and milestone management
- Payment processing integration
- Dispute resolution system
- AI-powered features

### Security Features
- **API Rate Limiting**: General and authentication-specific rate limiting to prevent abuse
- **Input Sanitization**: Protection against NoSQL injection and Cross-Site Scripting (XSS) attacks
- **Helmet Security**: Content Security Policy (CSP) and other security headers
- **Data Validation**: Comprehensive input validation using express-validator
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Authentication**: JWT-based authentication with refresh tokens
- **Password Security**: bcrypt implementation for secure password hashing

### Performance Features
- **API Caching**: Intelligent caching of frequently accessed data with TTL
- **Optimized Queries**: Efficient database queries with indexing
- **Pagination**: Proper pagination for all list endpoints
- **Response Optimization**: Efficient response formatting

### Monitoring & Logging
- **Structured Logging**: Comprehensive request/response logging with Winston
- **Error Tracking**: Detailed error logging for debugging
- **Performance Monitoring**: Request duration tracking
- **Security Logging**: Suspicious activity detection

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on the example values in the code

3. Run the development server:
```bash
npm run dev
```

## API Endpoints

### Versioned API (Recommended)
All API endpoints are available under the `/api/v1/` prefix for versioning. For example: `/api/v1/auth/login`

### Legacy API (For backward compatibility)
All API endpoints are also available without versioning for backward compatibility with existing clients.

### Authentication (`/auth` or `/api/v1/auth`)
- `POST /auth/register` or `POST /api/v1/auth/register` - Register a new user
- `POST /auth/login` or `POST /api/v1/auth/login` - Login with email and password
- `POST /auth/verify-email` or `POST /api/v1/auth/verify-email` - Verify email address
- `POST /auth/forgot-password` or `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /auth/reset-password` or `POST /api/v1/auth/reset-password` - Reset password
- `GET /auth/me` or `GET /api/v1/auth/me` - Get current user profile
- `PUT /auth/profile` or `PUT /api/v1/auth/profile` - Update profile (frontend expectation)
- `POST /auth/change-password` or `POST /api/v1/auth/change-password` - Change password (frontend expectation)
- `POST /auth/refresh` or `POST /api/v1/auth/refresh` - Refresh access token (frontend expectation)

### Users (`/users` or `/api/v1/users`)
- `GET /users/me` or `GET /api/v1/users/me` - Get current user profile
- `GET /users/:id` or `GET /api/v1/users/:id` - Get user by ID
- `PUT /users/:id` or `PUT /api/v1/users/:id` - Update user profile
- `PUT /users/:id/profile-picture` or `PUT /api/v1/users/:id/profile-picture` - Upload profile picture
- `GET /users/:id/kyc` or `GET /api/v1/users/:id/kyc` - Get KYC verification
- `POST /users/:id/kyc` or `POST /api/v1/users/:id/kyc` - Submit KYC verification
- `GET /users/search` or `GET /api/v1/users/search` - Search and filter users

### Projects (`/projects` or `/api/v1/projects`)
- `POST /projects` or `POST /api/v1/projects` - Create a new project
- `GET /projects/:id` or `GET /api/v1/projects/:id` - Get project by ID
- `GET /projects` or `GET /api/v1/projects` - Get user's projects
- `PUT /projects/:id` or `PUT /api/v1/projects/:id` - Update project
- `DELETE /projects/:id` or `DELETE /api/v1/projects/:id` - Delete project
- `PATCH /projects/:id/status` or `PATCH /api/v1/projects/:id/status` - Update project status
- `POST /projects/:id/invite` or `POST /api/v1/projects/:id/invite` - Invite freelancer to project (changed from freelancerEmail to email)
- `POST /projects/accept-invitation` or `POST /api/v1/projects/accept-invitation` - Accept project invitation
- `POST /projects/decline-invitation` or `POST /api/v1/projects/decline-invitation` - Decline project invitation
- `GET /projects/:id/activities` or `GET /api/v1/projects/:id/activities` - Get project activities
- `GET /projects/invitations/freelancer/:freelancerId` or `GET /api/v1/projects/invitations/freelancer/:freelancerId` - Get invitations for freelancer
- `GET /projects/search` or `GET /api/v1/projects/search` - Search projects
- `GET /projects/:id/milestones` or `GET /api/v1/projects/:id/milestones` - Get project milestones

### Milestones (`/milestones` or `/api/v1/milestones`)
- `POST /milestones` or `POST /api/v1/milestones` - Create a new milestone
- `GET /milestones/:id` or `GET /api/v1/milestones/:id` - Get milestone by ID
- `PUT /milestones/:id` or `PUT /api/v1/milestones/:id` - Update milestone
- `POST /milestones/:id/start` or `POST /api/v1/milestones/:id/start` - Start milestone
- `POST /milestones/:id/submit` or `POST /api/v1/milestones/:id/submit` - Submit milestone for review
- `POST /milestones/:id/approve` or `POST /api/v1/milestones/:id/approve` - Approve milestone
- `POST /milestones/:id/revision` or `POST /api/v1/milestones/:id/revision` - Request revision (changed from /request-revision to match frontend)
- `POST /milestones/:id/dispute` or `POST /api/v1/milestones/:id/dispute` - Dispute milestone

### Payments (`/payments` or `/api/v1/payments`)
- `GET /payments/methods/:userId` or `GET /api/v1/payments/methods/:userId` - Get payment methods for user
- `POST /payments/methods/:userId` or `POST /api/v1/payments/methods/:userId` - Add payment method for user
- `DELETE /payments/methods/:userId/:methodId` or `DELETE /api/v1/payments/methods/:userId/:methodId` - Remove payment method
- `GET /payments/escrow/:projectId` or `GET /api/v1/payments/escrow/:projectId` - Get escrow account for project
- `GET /payments/balance/:userId` or `GET /api/v1/payments/balance/:userId` - Get user balance
- `GET /payments/transactions` or `GET /api/v1/payments/transactions` - Get user's transactions
- `GET /payments/transactions/:id` or `GET /api/v1/payments/transactions/:id` - Get transaction by ID
- `GET /payments/payouts/:userId` or `GET /api/v1/payments/payouts/:userId` - Get payouts for user
- `POST /payments/payouts` or `POST /api/v1/payments/payouts` - Create payout
- `GET /payments/payouts/:payoutId` or `GET /api/v1/payments/payouts/:payoutId` - Get payout by ID
- `PATCH /payments/payouts/:payoutId/cancel` or `PATCH /api/v1/payments/payouts/:payoutId/cancel` - Cancel payout
- `POST /payments/payouts/estimate` or `POST /api/v1/payments/payouts/estimate` - Estimate payout fees
- `POST /payments/deposit` or `POST /api/v1/payments/deposit` - Deposit funds to escrow
- `POST /payments/release` or `POST /api/v1/payments/release` - Release payment for milestone
- `POST /payments/withdraw` or `POST /api/v1/payments/withdraw` - Request withdrawal
- `GET /payments/invoices/:invoiceId` or `GET /api/v1/payments/invoices/:invoiceId` - Get invoice by ID
- `GET /payments/invoices/:invoiceId/download` or `GET /api/v1/payments/invoices/:invoiceId/download` - Download invoice

### Disputes (`/disputes` or `/api/v1/disputes`)
- `POST /disputes` or `POST /api/v1/disputes` - Create a new dispute
- `POST /disputes/:id` or `POST /api/v1/disputes/:id` - Create a dispute by ID (duplicate to match milestone dispute from frontend)
- `GET /disputes/:id` or `GET /api/v1/disputes/:id` - Get dispute details
- `GET /disputes` or `GET /api/v1/disputes` - Get user disputes
- `POST /disputes/:id/messages` or `POST /api/v1/disputes/:id/messages` - Add message to dispute
- `POST /disputes/:id/mediation` or `POST /api/v1/disputes/:id/mediation` - Move dispute to mediation
- `POST /disputes/:id/assign-arbitrator` or `POST /api/v1/disputes/:id/assign-arbitrator` - Assign arbitrator to dispute
- `POST /disputes/:id/resolve` or `POST /api/v1/disputes/:id/resolve` - Resolve dispute