# ContraLock - Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Features & Functionality](#features--functionality)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [AI Service](#ai-service)
9. [Security & Authentication](#security--authentication)
10. [Configuration](#configuration)
11. [Development Workflow](#development-workflow)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

ContraLock is a milestone-based escrow platform for freelance payments, ensuring fair compensation for freelancers while protecting clients through transparent, milestone-based payment releases. The platform addresses common challenges in freelance work such as payment disputes, delivery verification, and trust issues between parties.

### Problem Statement
- Frequent payment disputes between clients and freelancers
- Risk of non-payment for completed work
- Difficulty verifying deliverable quality
- Lack of trust mechanisms in traditional payment systems

### Solution
A secure escrow system that:
- Holds client payments in escrow until milestones are completed
- Provides transparent milestone tracking
- Offers dispute resolution mechanisms
- Includes AI-powered verification and suggestions

### Target Audience
- Freelancers seeking reliable payment assurance
- Clients wanting protection against incomplete work
- Project managers overseeing remote teams
- Small business owners outsourcing work

---

## Architecture & Tech Stack

### Monorepo Structure
The project follows a monorepo architecture using pnpm and Turbo for efficient development across multiple services.

### Tech Stack

#### Frontend (apps/web):
- **Framework**: Next.js 16 (React-based)
- **Styling**: Tailwind CSS with Tailwind CSS Animate
- **UI Components**: Radix UI, Lucide React Icons
- **State Management**: Zustand, React Query
- **Form Handling**: React Hook Form, Zod
- **Date Handling**: date-fns
- **Charts**: Recharts
- **Notifications**: Sonner

#### Backend API (apps/api):
- **Runtime**: Node.js with Express.js framework
- **Database**: SQLite (with Sequelize ORM) - File-based, no external server needed
- **Authentication**: JWT with refresh tokens
- **Security**: Helmet, express-rate-limit, express-mongo-sanitize
- **Email Services**: Nodemailer with Handlebars templates
- **File Upload**: Multer
- **Logging**: Winston
- **Validation**: Joi, Express-validator
- **Payment Processing**: Stripe
- **Real-time Communication**: Socket.IO
- **Cron Jobs**: node-cron
- **Caching**: Node-cache

#### AI Service (apps/ai-service):
- **Runtime**: Node.js with Express.js framework
- **AI Provider**: OpenAI API
- **Features**: Smart milestone suggestions, deliverable verification, dispute analysis

### Infrastructure
- **Build Tool**: Turbo (for monorepo management)
- **Package Manager**: pnpm (recommended)
- **Testing Framework**: Jest (with @testing-library)
- **Code Quality**: ESLint, Prettier
- **Git Hooks**: Husky

---

## Project Structure

```
contralock/
├── apps/
│   ├── web/           # Next.js frontend application
│   ├── api/           # Express.js backend API
│   └── ai-service/    # AI microservice
├── packages/
├── data/              # SQLite database file location
├── docs/              # Documentation files
├── .github/           # GitHub workflows and issue templates
├── .turbo/            # Turbo cache configuration
├── node_modules/
├── package.json       # Root package.json with monorepo scripts
├── pnpm-workspace.yaml
├── turbo.json         # Turbo configuration
├── README.md          # Main project README
├── CONFIGURATION.md   # Configuration guide
├── PRD.md             # Product Requirements Document
├── FRD.md             # Functional Requirements Document
└── various utility scripts
```

### App Directories

#### `apps/api/`
```
src/
├── controllers/        # Request handlers
├── middleware/         # Custom middleware
├── models/            # Database models
├── routes/            # API route definitions
├── services/          # Business logic
├── utils/             # Utility functions
├── validators/        # Request validation schemas
├── config/            # Configuration files
├── templates/         # Email templates
└── index.js           # Entry point
```

#### `apps/web/`
```
src/
├── app/               # Next.js 13+ App Router pages
├── components/        # Reusable UI components
├── lib/               # Shared utilities
├── hooks/             # Custom React hooks
├── services/          # API service layer
├── store/             # State management
├── types/             # Type definitions
├── styles/            # Global styles
└── public/            # Static assets
```

#### `apps/ai-service/`
```
src/
├── controllers/       # AI service controllers
├── middleware/        # AI service middleware
├── routes/            # AI service routes
├── services/          # AI service business logic
├── utils/             # AI service utilities
└── index.js           # Entry point
```

---

## Features & Functionality

### User Management
- **Registration & Login**: Secure authentication with email verification
- **Profile Management**: Update user information, profile picture
- **KYC Verification**: Identity verification system for trust
- **Role-based Access**: Different views for clients and freelancers
- **Password Management**: Secure password reset with email tokens

### Project Management
- **Project Creation**: Clients can create detailed project descriptions
- **Milestone Planning**: Structured milestone creation with deadlines
- **Invitation System**: Invite freelancers to projects with email
- **Status Tracking**: Project status lifecycle (Draft → Active → Completed → Closed)
- **Activity Feed**: Real-time updates on project progress
- **File Attachments**: Upload documents related to projects

### Payment System
- **Escrow Payments**: Client funds held securely until milestone completion
- **Stripe Integration**: Secure payment processing (credit cards, bank transfers)
- **Flexible Pricing**: Fixed-price, hourly, or milestone-based payments
- **Transaction History**: Detailed records of all payments
- **Withdrawal System**: Freelancers can withdraw earnings
- **Fee Calculation**: Automatic calculation of platform fees and taxes
- **Invoice Generation**: Automated invoice creation and download

### Milestone Tracking
- **Milestone Creation**: Define deliverables with acceptance criteria
- **Progress Tracking**: Visual progress indicators for each milestone
- **Submission Process**: Freelancers submit work for review
- **Approval Flow**: Client approval or revision request
- **Timeline Management**: Deadline tracking and notifications
- **Quality Assurance**: Verification against acceptance criteria

### Dispute Resolution
- **Multi-stage Process**: Prevention → Mediation → Arbitration → Resolution
- **Evidence Submission**: Upload supporting documents and communications
- **Neutral Arbitration**: Fair and impartial dispute resolution
- **AI Assistance**: AI-powered analysis of disputes
- **Documentation**: Complete record of dispute proceedings
- **Automatic Escalation**: Timely escalation if resolution isn't reached

### AI-Powered Features
- **Smart Milestone Suggestions**: AI-generated milestone recommendations based on project description
- **Deliverable Verification**: AI analysis comparing deliverables to acceptance criteria
- **Dispute Analysis**: AI-assisted evaluation of dispute claims
- **Market Rate Analysis**: Pricing recommendations based on market data
- **Predictive Analytics**: Risk assessment and dispute prediction

### Notifications & Communication
- **Real-time Updates**: WebSocket-based notifications
- **Email Notifications**: Important updates sent via email
- **In-app Messages**: Direct messaging between parties
- **Activity Tracking**: Comprehensive event log
- **Push Notifications**: Mobile-friendly notification system

### Admin Dashboard
- **User Management**: View and manage all users
- **Project Monitoring**: Oversee active projects
- **Financial Reports**: Detailed payment and fee analytics
- **Audit Logs**: Comprehensive system activity tracking
- **Content Moderation**: Review flagged content and disputes
- **System Health**: Monitor service performance

---

## Database Schema

### Core Models

#### User Model
```javascript
{
  id: UUID,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: Enum ('client', 'freelancer'),
  avatar: String (URL),
  phone: String,
  bio: String,
  isEmailVerified: Boolean,
  isKYCVerified: Boolean,
  kycDocuments: JSON,
  stripeCustomerId: String,
  notificationPreferences: JSON,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date (soft delete)
}
```

#### Project Model
```javascript
{
  id: UUID,
  title: String,
  description: String,
  clientId: UUID (foreign key),
  freelancerId: UUID (foreign key, nullable),
  budget: Number,
  currency: String,
  deadline: Date,
  status: Enum ('draft', 'active', 'completed', 'cancelled', 'disputed'),
  category: String,
  skillsRequired: Array of Strings,
  attachments: Array of Objects,
  invitedFreelancers: Array of UUIDs,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date (soft delete)
}
```

#### Milestone Model
```javascript
{
  id: UUID,
  projectId: UUID (foreign key),
  title: String,
  description: String,
  acceptanceCriteria: String,
  budget: Number,
  status: Enum ('planned', 'inprogress', 'submitted', 'approved', 'rejected', 'disputed'),
  deadline: Date,
  startDate: Date,
  submittedAt: Date,
  approvedAt: Date,
  orderId: String (for integration with payment system),
  createdAt: Date,
  updatedAt: Date
}
```

#### Payment/Escrow Model
```javascript
{
  id: UUID,
  projectId: UUID (foreign key),
  milestoneId: UUID (foreign key, nullable),
  amount: Number,
  currency: String,
  type: Enum ('deposit', 'release', 'refund', 'fee'),
  status: Enum ('pending', 'completed', 'failed', 'refunded'),
  paymentMethod: String,
  transactionId: String (from payment processor),
  metadata: JSON,
  createdAt: Date,
  updatedAt: Date
}
```

#### Transaction Model
```javascript
{
  id: UUID,
  userId: UUID (foreign key),
  projectId: UUID (foreign key),
  amount: Number,
  type: Enum ('deposit', 'withdrawal', 'payment', 'refund', 'fee', 'dispute_refund'),
  status: Enum ('pending', 'completed', 'failed', 'cancelled'),
  description: String,
  balanceBefore: Number,
  balanceAfter: Number,
  referenceId: String,
  metadata: JSON,
  createdAt: Date,
  updatedAt: Date
}
```

#### Dispute Model
```javascript
{
  id: UUID,
  projectId: UUID (foreign key),
  milestoneId: UUID (foreign key),
  raisedBy: UUID (foreign key, user who raised dispute),
  reason: String,
  evidence: Array of Objects,
  status: Enum ('raised', 'mediation', 'arbitration', 'resolved', 'cancelled'),
  mediationNotes: String,
  arbitrationNotes: String,
  resolutionSummary: String,
  resolvedBy: UUID (admin who resolved),
  resolvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Message Model
```javascript
{
  id: UUID,
  projectId: UUID (foreign key),
  senderId: UUID (foreign key),
  receiverId: UUID (foreign key),
  content: String,
  messageType: Enum ('text', 'attachment', 'system'),
  attachments: Array of Objects,
  readStatus: Boolean,
  metadata: JSON,
  createdAt: Date
}
```

---

## API Endpoints

### Authentication (`/auth` or `/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login with email and password |
| POST | `/verify-email` | Verify email address |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password |
| GET | `/me` | Get current user profile |
| PUT | `/profile` | Update profile information |
| POST | `/change-password` | Change current password |
| POST | `/refresh` | Refresh access token |

### Users (`/users` or `/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get current user profile |
| GET | `/:id` | Get user by ID |
| PUT | `/:id` | Update user profile |
| PUT | `/:id/profile-picture` | Upload profile picture |
| GET | `/:id/kyc` | Get KYC verification status |
| POST | `/:id/kyc` | Submit KYC verification |
| GET | `/search` | Search and filter users |

### Projects (`/projects` or `/api/v1/projects`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create a new project |
| GET | `/:id` | Get project by ID |
| GET | `/` | Get user's projects |
| PUT | `/:id` | Update project |
| DELETE | `/:id` | Delete project |
| PATCH | `/:id/status` | Update project status |
| POST | `/:id/invite` | Invite freelancer to project |
| POST | `/accept-invitation` | Accept project invitation |
| POST | `/decline-invitation` | Decline project invitation |
| GET | `/:id/activities` | Get project activities |
| GET | `/invitations/freelancer/:freelancerId` | Get invitations for freelancer |
| GET | `/search` | Search projects |
| GET | `/:id/milestones` | Get project milestones |

### Milestones (`/milestones` or `/api/v1/milestones`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create a new milestone |
| GET | `/:id` | Get milestone by ID |
| PUT | `/:id` | Update milestone |
| POST | `/:id/start` | Start milestone |
| POST | `/:id/submit` | Submit milestone for review |
| POST | `/:id/approve` | Approve milestone |
| POST | `/:id/revision` | Request revision for milestone |
| POST | `/:id/dispute` | Dispute milestone |

### Payments (`/payments` or `/api/v1/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/methods/:userId` | Get payment methods for user |
| POST | `/methods/:userId` | Add payment method for user |
| DELETE | `/methods/:userId/:methodId` | Remove payment method |
| GET | `/escrow/:projectId` | Get escrow account for project |
| GET | `/balance/:userId` | Get user balance |
| GET | `/transactions` | Get user's transactions |
| GET | `/transactions/:id` | Get transaction by ID |
| GET | `/payouts/:userId` | Get payouts for user |
| POST | `/payouts` | Create payout |
| GET | `/payouts/:payoutId` | Get payout by ID |
| PATCH | `/payouts/:payoutId/cancel` | Cancel payout |
| POST | `/payouts/estimate` | Estimate payout fees |
| POST | `/deposit` | Deposit funds to escrow |
| POST | `/release` | Release payment for milestone |
| POST | `/withdraw` | Request withdrawal |
| GET | `/invoices/:invoiceId` | Get invoice by ID |
| GET | `/invoices/:invoiceId/download` | Download invoice |

### Disputes (`/disputes` or `/api/v1/disputes`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create a new dispute |
| POST | `/:id` | Create a dispute by ID (duplicate to match milestone dispute from frontend) |
| GET | `/:id` | Get dispute details |
| GET | `/` | Get user disputes |
| POST | `/:id/messages` | Add message to dispute |
| POST | `/:id/mediation` | Move dispute to mediation |
| POST | `/:id/assign-arbitrator` | Assign arbitrator to dispute |
| POST | `/:id/resolve` | Resolve dispute |

### AI Service Endpoints (`/api/v1/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/milestone-suggestions` | Get AI suggestions for project milestones |
| POST | `/ai/verify-deliverable` | Check if deliverable meets acceptance criteria |
| POST | `/ai/dispute-analysis` | AI analysis of disputes |

### Additional Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check endpoint |
| GET | `/api/version` | Version information |

---

## Frontend Components

### Navigation & Layout
- **Header Component**: Site navigation, user profile dropdown, notifications
- **Sidebar Component**: Main navigation menu with icons and labels
- **Footer Component**: Legal links, social media, contact information
- **Dashboard Layout**: Responsive layout for admin and user dashboards

### Authentication Components
- **Login Form**: Email/password login with validation
- **Registration Form**: Multi-step registration with role selection
- **Password Reset**: Email verification and password reset flow
- **Forgot Password**: Recovery flow with email verification

### Project Management Components
- **Project Card**: Interactive card with status, progress, and actions
- **Project Form**: Multi-step form for creating/editing projects
- **Project Dashboard**: Overview with key metrics and recent activity
- **Invitation Modal**: Email invitation modal with preview
- **Project Activity Feed**: Timeline of project events and updates

### Milestone Components
- **Milestone Card**: Shows progress, deadline, and status
- **Milestone Form**: Creation and editing interface
- **Milestone Progress Bar**: Visual representation of completion
- **Submission Form**: Deliverable submission interface
- **Review Interface**: Approval/rejection workflow

### Payment Components
- **Payment Method Card**: Display and management of saved payment methods
- **Checkout Form**: Secure payment form with validation
- **Transaction History**: Tabulated view of financial activity
- **Balance Widget**: Current balance and available funds display
- **Invoice Generator**: Invoice preview and generation interface

### User Profile Components
- **Profile Card**: Public profile information display
- **Profile Editor**: Form for updating user information
- **KYC Verification**: Document upload and verification interface
- **Notification Preferences**: Settings panel for notification management
- **Security Settings**: Password change and session management

### Dispute Resolution Components
- **Dispute Form**: Dispute creation with evidence attachment
- **Dispute Status Tracker**: Progress indicator for dispute resolution
- **Communication Panel**: Real-time messaging for dispute participants
- **Mediation Interface**: Mediation session controls and notes
- **Resolution Summary**: Outcome display and documentation

### AI-Powered Components
- **Smart Suggestions Panel**: AI-generated milestone recommendations
- **Verification Checker**: AI-powered deliverable verification interface
- **Dispute Analysis Report**: AI-generated analysis of disputes
- **Market Insights**: Market rate and pricing recommendations

### Data Visualization Components
- **Charts & Graphs**: Revenue, project completion rates, activity
- **Statistics Cards**: Key performance indicators
- **Trend Analysis**: Time-series data visualization
- **User Behavior Metrics**: Engagement and usage statistics

### Utility Components
- **Loading Spinner**: Various loading states
- **Toast Notifications**: Success/error/warning messages
- **Modal Dialogs**: Confirmation and information modals
- **File Upload**: Drag-and-drop file upload interfaces
- **Rich Text Editor**: Content creation tools

---

## AI Service

### Overview
The AI service provides intelligent features to enhance the platform experience, powered by OpenAI's API.

### Core Features

#### Smart Milestone Suggestions
- **Input**: Project title, description, and requirements
- **Processing**: Natural Language Processing to extract key deliverables
- **Output**: Structured list of suggested milestones with acceptance criteria
- **Algorithm**: Uses GPT model to analyze project complexity and suggest appropriate breakdowns

#### Deliverable Verification
- **Input**: Original acceptance criteria vs. submitted deliverable
- **Processing**: Semantic analysis to compare requirements with deliverables
- **Output**: Confidence score and detailed comparison report
- **Algorithm**: Uses embeddings to measure similarity between texts

#### Dispute Analysis
- **Input**: Dispute details, evidence, and participant arguments
- **Processing**: Sentiment analysis and logical evaluation
- **Output**: Neutral assessment with recommendation
- **Algorithm**: Analyzes textual evidence to provide balanced perspective

### Implementation Details
- **API Gateway**: RESTful API with rate limiting
- **Caching**: Response caching for frequent queries
- **Error Handling**: Graceful degradation when API unavailable
- **Security**: Input sanitization and validation
- **Logging**: Query tracking and audit logs

### Integration Points
- Called from frontend forms during project creation
- Triggered during milestone submission review
- Used during dispute resolution process
- Available as standalone API endpoints

---

## Security & Authentication

### Authentication System
- **Token-Based Authentication**: JWT (JSON Web Tokens) with refresh tokens
- **Secure Storage**: HttpOnly cookies for sensitive tokens
- **Expiration**: Short-lived access tokens (15 minutes) with longer refresh tokens (7 days)
- **Regeneration**: Automatic token refresh before expiration
- **Revocation**: Support for token blacklisting

### Password Security
- **Hashing Algorithm**: bcrypt with configurable work factor (default: 12 rounds)
- **Salt Generation**: Automatic salt generation for each password
- **Strength Requirements**: Minimum complexity rules enforced
- **Encryption**: PBKDF2 for additional layer of security

### API Security Measures
- **Rate Limiting**: Per-endpoint and per-IP rate limiting to prevent abuse
- **Input Validation**: Comprehensive validation using express-validator
- **Sanitization**: Protection against XSS and injection attacks
- **CORS**: Proper cross-origin resource sharing configuration
- **Helmet**: Security headers for HTTP response hardening
- **HTTPS**: TLS/SSL encryption in production

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **Access Control**: Role-based permissions system
- **Audit Logging**: Comprehensive logging of sensitive operations
- **PII Protection**: Personal Information Identification protection
- **GDPR Compliance**: Right to deletion and data portability

### Session Management
- **Token Expiration**: Automatic logout after inactivity
- **Multi-device**: Support for multiple simultaneous sessions
- **Session Revoke**: Ability to revoke all sessions
- **Activity Tracking**: Log of login/logout times

### Secure File Uploads
- **Type Validation**: Strict file type validation
- **Size Limits**: Configurable file size limits
- **Virus Scanning**: Integration with antivirus on upload
- **Storage Security**: Files stored with random filenames
- **Access Control**: Permission-based file access

### Penetration Testing Preparedness
- **Security Headers**: Content Security Policy, HSTS
- **Input Filtering**: Protection against common attack vectors
- **Dependency Scanning**: Regular security audits of dependencies
- **Vulnerability Assessment**: Automated scanning tools integration

---

## Configuration

### Environment Variables

#### Root Directory (.env)
```env
NODE_ENV=development
DATABASE_URL=file:./contralock.sqlite
SECRET_KEY=your-super-secret-key-change-in-production
```

#### API Service (apps/api/.env)
```env
PORT=3001
DB_TYPE=sqlite
DB_PATH=./data/contralock.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
OPENAI_API_KEY=your-openai-api-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@contralock.com
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
```

#### Web Frontend (apps/web/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_AWS_S3_BUCKET_URL=https://your-bucket.s3.amazonaws.com
```

#### AI Service (apps/ai-service/.env)
```env
PORT=3002
OPENAI_API_KEY=your-openai-api-key
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
LOG_LEVEL=info
MAX_REQUESTS_PER_MINUTE=10
CACHE_TTL_SECONDS=300
```

### Configuration Management
- **Local Development**: Use .env files in each service
- **Staging**: Environment-specific configurations
- **Production**: Encrypted environment variables
- **Secrets Management**: External secrets management (HashiCorp Vault, AWS Secrets Manager)

### Database Configuration
- **SQLite**: Default for development (file-based, no server needed)
- **PostgreSQL**: Recommended for production
- **MongoDB**: Alternative document database option
- **Connection Pooling**: Optimized connection management
- **Migration Strategy**: Automated schema migrations

---

## Development Workflow

### Prerequisites
- Node.js v18 or higher
- pnpm (recommended) or npm
- Git
- A code editor with JavaScript/TypeScript support

### Setup Instructions

#### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/your-organization/contralock.git
cd contralock

# Install dependencies using pnpm (recommended)
pnpm install

# Or if using npm
npm install
```

#### 2. Individual Service Setup
```bash
# Set up API service
cd apps/api
npm install
# Configure .env file (see Configuration section)

# Set up AI service
cd ../ai-service
npm install
# Configure .env file

# Set up web service
cd ../web
npm install
# Configure .env.local file

### Mock Data System

The project includes a comprehensive mock data system that allows for development and testing without backend services.

#### Features
- Complete mock data for users, projects, milestones, transactions, and disputes
- Realistic scenarios with detailed information
- Full API service mocking capabilities
- Automatic switching between mock and real API based on configuration

#### Configuration
- Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in your environment
- Or enable via localStorage: `localStorage.setItem('useMockData', 'true')`
- Enabled by default in development mode

#### Dispute Mock Data
New comprehensive mock data has been added for dispute scenarios including:

- 8 different dispute types covering common real-world scenarios
- Detailed evidence files of various types (PDF, PNG, ZIP, MP4, DOCX)
- Communication logs between parties
- AI analysis and resolution recommendations
- Multiple dispute statuses and phases
- Mediator and arbitrator assignments

The mock dispute data is available through the `getMockDisputes()` function and is automatically used when mock mode is enabled.
```

#### 3. Running the Development Environment
```bash
# Option 1: Run all services concurrently (from root)
npm run dev

# Option 2: Run individual services separately
cd apps/api && npm run dev
cd apps/ai-service && npm run dev
cd apps/web && npm run dev
```

### Development Tools & Commands

#### Monorepo Commands (Root Directory)
```bash
# Run all development servers
npm run dev

# Build all packages
npm run build

# Run tests across all packages
npm run test

# Check code formatting
npm run format

# Run linting across all packages
npm run lint

# Type checking across all packages
npm run typecheck
```

#### Individual Service Commands

##### API Service Commands
```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Check code coverage
npm run test:coverage

# Format code
npm run format

# Lint code
npm run lint

# Generate API documentation
npm run docs
```

##### Frontend Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run tests
npm run test

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint

# Type checking
npm run typecheck

# Format code
npm run format
```

##### AI Service Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Run integration tests
npm run test:integration

# Format code
npm run format

# Check for vulnerabilities
npm run audit
```

### Git Workflow
- **Main Branch**: Production-ready code
- **Develop Branch**: Integration branch for feature development
- **Feature Branches**: Individual features prefixed with `feature/`
- **Bug Fixes**: Prefixed with `fix/`
- **Hotfixes**: Prefixed with `hotfix/`
- **Pull Requests**: Required for all code changes
- **Code Reviews**: Mandatory for all PRs

### Code Standards
- **ESLint**: Enforced JavaScript/TypeScript linting
- **Prettier**: Consistent code formatting
- **Commit Conventions**: Conventional Commits specification
- **Component Naming**: PascalCase for React components
- **File Organization**: Feature-first organization
- **Documentation**: JSDoc for public functions

### Continuous Integration
- **Automated Testing**: Unit, integration, and E2E tests
- **Code Coverage**: Minimum 80% coverage requirement
- **Security Scanning**: Dependency vulnerability checks
- **Build Verification**: Automated builds for all platforms
- **Code Quality**: Static analysis and linting

---

## Deployment

### Production Architecture
- **Frontend**: Hosted on Vercel (recommended) or similar CDN platform
- **Backend API**: Node.js runtime on AWS EC2, Google Cloud Run, or Heroku
- **AI Service**: Containerized service with auto-scaling
- **Database**: PostgreSQL on AWS RDS, Google Cloud SQL, or similar managed service
- **CDN**: For static assets and file uploads
- **Load Balancer**: Distribution of traffic across multiple instances
- **Monitoring**: Application performance monitoring (APM) tools

### Deployment Options

#### Option 1: Cloud-Native Deployment (Recommended)
- **Frontend**: Vercel or Netlify
- **Backend**: Docker containers on AWS ECS, Google Cloud Run, or Railway
- **Database**: Managed PostgreSQL on cloud provider
- **CDN**: CloudFlare for global content distribution
- **Monitoring**: Sentry for error tracking, New Relic for APM

#### Option 2: All-in-One Platform
- **Platform**: Railway, Render, or Fly.io
- **Benefits**: Simplified deployment process
- **Considerations**: Potential vendor lock-in, limited customization

#### Option 3: Self-Hosted
- **Infrastructure**: Kubernetes cluster
- **Container Registry**: Private Docker registry
- **Reverse Proxy**: NGINX or Traefik
- **SSL Termination**: Let's Encrypt certificates
- **Backup**: Automated database backups

### Deployment Process

#### Pre-deployment Checklist
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage meets minimum requirements
- [ ] Security scans completed and vulnerabilities addressed
- [ ] Performance benchmarks met
- [ ] Production environment configured
- [ ] SSL certificates ready (if applicable)
- [ ] Domain names configured
- [ ] Email service configured
- [ ] Payment gateway configured
- [ ] Database migration scripts ready

#### Deployment Steps
1. **Prepare Release**
   - Merge develop to main branch
   - Create Git tag for release (e.g., v1.2.3)
   - Run final test suite
   - Generate release notes

2. **Deploy Backend Services**
   ```bash
   # Deploy API service
   # Deploy AI service
   
   # Run database migrations
   # Verify services are healthy
   ```

3. **Deploy Frontend**
   - Build static assets
   - Deploy to CDN/hosting platform
   - Configure DNS if needed
   - Verify frontend connectivity to backend

4. **Health Checks**
   - Verify all endpoints accessible
   - Test user flows end-to-end
   - Monitor application performance
   - Check error logs

5. **Post-Deployment**
   - Monitor application health
   - Track user adoption of new features
   - Rollback plan ready if issues arise
   - Communicate release to stakeholders

### Environment Management
- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live user-facing environment
- **Environment Parity**: Similar configuration across environments
- **Data Separation**: Isolated data per environment

### Monitoring & Observability
- **Application Logs**: Centralized log aggregation
- **Error Tracking**: Real-time error monitoring
- **Performance Metrics**: Response times, throughput
- **Business Metrics**: User engagement, conversion rates
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Alerts**: Automated notifications for critical issues

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Database Connection Issues
**Symptoms:**
- "Connection refused" errors
- Database migration failures
- "Database file not found"

**Solutions:**
```bash
# Ensure data directory exists
mkdir -p apps/api/data

# Check file permissions
chmod 755 apps/api/data

# Verify SQLite path in .env
DB_PATH=./data/contralock.sqlite
```

#### 2. API Service Not Starting
**Symptoms:**
- Port already in use
- Missing environment variables
- Dependencies not installed

**Solutions:**
```bash
# Check if port is in use
netstat -tulpn | grep :3001

# Kill process using port
kill $(lsof -t -i:3001)

# Verify environment variables
node -e "console.log(process.env.PORT || '3001')"

# Reinstall dependencies
cd apps/api && npm install --force
```

#### 3. Frontend Cannot Connect to API
**Symptoms:**
- CORS errors
- Network timeout
- API returning 404

**Solutions:**
- Verify NEXT_PUBLIC_API_URL in frontend .env.local
- Check if API service is running on correct port
- Ensure backend is configured for correct origin
- Try accessing API directly via Postman/Browser

#### 4. Authentication Failures
**Symptoms:**
- Invalid token errors
- Login not persisting
- Password reset not working

**Solutions:**
- Verify JWT_SECRET and REFRESH_TOKEN_SECRET are consistent
- Check expiry times are appropriate
- Ensure HTTPS is used in production
- Verify token storage mechanism

#### 5. Payment Integration Issues
**Symptoms:**
- Stripe errors
- Webhook failures
- Incorrect amounts

**Solutions:**
- Verify Stripe API keys are correct
- Check webhook endpoint is publicly accessible
- Test with Stripe test keys initially
- Verify currency and amount formatting

#### 6. AI Service Not Responding
**Symptoms:**
- 500 errors on AI endpoints
- Slow response times
- Invalid OpenAI responses

**Solutions:**
- Verify OPENAI_API_KEY is correct and has sufficient credits
- Check OpenAI API status
- Confirm rate limits are not exceeded
- Verify API endpoint configurations

### Debugging Strategies

#### Frontend Debugging
1. **Browser Developer Tools**
   - Network tab for API call inspection
   - Console for error messages
   - React DevTools for component state

2. **Next.js Specific**
   - Enable React Strict Mode warnings
   - Check for hydration errors
   - Verify API route paths

3. **State Management**
   - Monitor Zustand store changes
   - Check React Query cache invalidation
   - Verify form validation logic

#### Backend Debugging
1. **Express.js Specific**
   - Enable detailed logging
   - Check middleware execution order
   - Verify route parameter parsing

2. **Database Debugging**
   - Enable SQL query logging
   - Check foreign key relationships
   - Verify transaction boundaries

3. **Authentication Debugging**
   - Log token generation/validation
   - Check JWT payload content
   - Verify cookie settings

#### AI Service Debugging
1. **API Calls**
   - Log OpenAI request/response
   - Check token usage
   - Verify prompt formatting

2. **Caching Issues**
   - Clear cache when testing
   - Check TTL settings
   - Verify cache keys

### Performance Issues

#### Frontend Performance
- **Bundle Size**: Check for oversized dependencies
- **Image Optimization**: Use Next.js Image component
- **Server-side Rendering**: Optimize SSR vs CSR balance
- **Caching**: Implement proper caching strategies

#### Backend Performance
- **Database Queries**: Optimize with indexes and proper queries
- **Memory Usage**: Monitor heap memory consumption
- **API Latency**: Identify slow endpoints
- **Caching**: Implement Redis caching where appropriate

### Logging & Monitoring
- **Centralized Logging**: Implement structured logging
- **Error Tracking**: Set up crash reporting
- **Performance Monitoring**: Monitor response times
- **User Activity**: Track feature usage

### Contact Support
- **GitHub Issues**: For bugs and feature requests
- **Documentation**: Check official documentation first
- **Community**: Join developer community channels
- **Commercial Support**: Available for enterprise customers

---

## Conclusion

ContraLock represents a comprehensive solution to the challenges facing the freelance market, combining robust technical architecture with innovative features to create a trustworthy platform for client-freelancer relationships. The monorepo approach enables efficient development while maintaining separation of concerns between the frontend, backend, and AI services.

This documentation serves as a complete guide to understanding, developing, and maintaining the platform, covering everything from initial setup to production deployment and troubleshooting.