# ContraLock Functional Requirements Document (FRD)

## Document Information

**Product Name:** ContraLock
**Version:** 1.0
**Date:** November 29, 2025
**Document Owner:** Product Team
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose
This Functional Requirements Document (FRD) defines the detailed functional specifications for Delivault, a milestone-based escrow platform for freelance payments. It serves as a blueprint for the development team and provides a comprehensive understanding of what the system must do.

### 1.2 Scope
This document covers all functional requirements for the MVP and subsequent phases of Delivault, including:
- User management and authentication
- Project and milestone management
- Payment processing and escrow
- Messaging and communication
- Dispute resolution
- AI-powered features
- Administrative functions

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|------------|
| Client | User who posts projects and pays for services |
| Freelancer | User who delivers services and receives payment |
| Milestone | A defined deliverable with specific acceptance criteria and payment amount |
| Escrow | Holding funds securely until conditions are met |
| Arbitrator | Third-party expert who resolves disputes |
| KYC | Know Your Customer - identity verification process |
| 2FA | Two-Factor Authentication |
| MVP | Minimum Viable Product |

---

## 2. System Overview

### 2.1 System Architecture
Delivault consists of:
- Web application (client-facing)
- Mobile application (Phase 2)
- RESTful API backend
- AI service (microservice)
- Admin dashboard
- Payment processing integration (Stripe)
- Real-time messaging (WebSocket)

### 2.2 User Roles

**Client**
- Creates projects
- Deposits funds to escrow
- Reviews and approves milestones
- Initiates disputes
- Rates freelancers

**Freelancer**
- Accepts project invitations
- Submits milestone deliverables
- Initiates disputes
- Receives payments
- Rates clients

**Admin**
- Manages users
- Monitors transactions
- Reviews disputes
- Manages platform settings
- Views analytics

**Arbitrator**
- Reviews dispute cases
- Makes binding decisions
- Communicates with disputing parties

---

## 3. Functional Requirements

### 3.1 User Management

#### 3.1.1 User Registration

**FR-UM-001: Email Registration**
- **Description:** Users can register using email and password
- **Preconditions:** None
- **Input:** Email address, password, first name, last name, role (client/freelancer)
- **Process:**
  1. User navigates to registration page
  2. User enters required information
  3. System validates email format and password strength (min 8 chars, 1 uppercase, 1 number, 1 special char)
  4. System checks if email already exists
  5. System hashes password using bcrypt
  6. System creates user account with status "unverified"
  7. System sends verification email
- **Output:** User account created, verification email sent
- **Postconditions:** User can log in after email verification
- **Business Rules:**
  - Email must be unique
  - Password must meet security requirements
  - Users must verify email within 24 hours

**FR-UM-002: Social Login**
- **Description:** Users can register/login using Google or LinkedIn
- **Priority:** Phase 2
- **Input:** OAuth token from provider
- **Process:**
  1. User clicks "Continue with Google/LinkedIn"
  2. System redirects to OAuth provider
  3. User authorizes access
  4. System receives user data
  5. System creates or retrieves user account
  6. System generates JWT token
- **Output:** User logged in
- **Business Rules:**
  - Email from social provider must be verified
  - If email exists, link accounts

**FR-UM-003: Email Verification**
- **Description:** New users must verify their email address
- **Input:** Verification token from email link
- **Process:**
  1. User clicks verification link in email
  2. System validates token (check expiry, signature)
  3. System updates user status to "verified"
  4. System redirects to login page
- **Output:** Email verified confirmation
- **Business Rules:**
  - Token expires after 24 hours
  - User can request new verification email (max 3 times per hour)

#### 3.1.2 User Authentication

**FR-UM-004: User Login**
- **Description:** Users can log in with email and password
- **Input:** Email, password
- **Process:**
  1. User enters credentials
  2. System validates email exists
  3. System compares hashed password
  4. System checks account status (active/suspended)
  5. System generates JWT access token (15 min expiry) and refresh token (7 days)
  6. System logs login event (timestamp, IP, device)
- **Output:** JWT tokens, user profile data
- **Error Handling:**
  - Invalid credentials: "Invalid email or password"
  - Unverified email: "Please verify your email"
  - Suspended account: "Account suspended. Contact support"
  - Max login attempts (5): Lock account for 15 minutes

**FR-UM-005: Two-Factor Authentication (2FA)**
- **Description:** Users can enable 2FA for additional security
- **Priority:** Phase 2
- **Input:** TOTP code from authenticator app
- **Process:**
  1. User enables 2FA in settings
  2. System generates QR code
  3. User scans with authenticator app
  4. User enters verification code
  5. System validates and stores 2FA secret
  6. For subsequent logins, system requires TOTP code after password
- **Output:** 2FA enabled, backup codes generated
- **Business Rules:**
  - Required for transactions over $10,000
  - 10 backup codes provided

**FR-UM-006: Password Reset**
- **Description:** Users can reset forgotten password
- **Input:** Email address
- **Process:**
  1. User clicks "Forgot Password"
  2. User enters email address
  3. System sends reset link (token valid 1 hour)
  4. User clicks link and enters new password
  5. System validates password requirements
  6. System updates password hash
  7. System invalidates all existing sessions
- **Output:** Password updated, confirmation email sent
- **Business Rules:**
  - Cannot reuse last 3 passwords
  - Reset link single-use only

**FR-UM-007: Session Management**
- **Description:** System manages user sessions securely
- **Process:**
  1. Access token expires after 15 minutes
  2. Client uses refresh token to get new access token
  3. Refresh token expires after 7 days
  4. System logs all refresh token usage
  5. User can revoke sessions from settings
- **Business Rules:**
  - Max 5 concurrent sessions per user
  - Session terminated on password change

#### 3.1.3 User Profile Management

**FR-UM-008: View Profile**
- **Description:** Users can view their profile information
- **Output:** Display name, email, role, profile picture, bio, portfolio links, rating, completed projects count, verification badges

**FR-UM-009: Edit Profile**
- **Description:** Users can update profile information
- **Input:** First name, last name, bio, location, skills, portfolio links, profile picture
- **Process:**
  1. User navigates to profile settings
  2. User updates fields
  3. System validates inputs (max lengths, URL formats)
  4. System saves changes
  5. System updates profile completion percentage
- **Validation Rules:**
  - Bio: Max 500 characters
  - Skills: Max 15 tags
  - Portfolio: Max 5 URLs
  - Profile picture: Max 5MB, JPG/PNG only

**FR-UM-010: Identity Verification (KYC)**
- **Description:** Users verify identity for higher transaction limits
- **Input:** Government ID photo, selfie, address proof
- **Process:**
  1. User uploads required documents
  2. System validates file formats and sizes
  3. System sends to verification service (e.g., Stripe Identity)
  4. Admin reviews if automated verification fails
  5. System updates verification status
  6. User receives notification
- **Output:** Verified badge on profile
- **Business Rules:**
  - Required for transactions over $500
  - Verification valid for 2 years
  - Status: unverified, pending, verified, rejected

**FR-UM-011: Payment Method Management**
- **Description:** Users manage payment methods for deposits/withdrawals
- **For Clients:**
  - Add credit/debit card via Stripe
  - Add bank account for ACH transfers
  - Set default payment method
- **For Freelancers:**
  - Add bank account for payouts
  - Add PayPal account
  - Verify account ownership (micro-deposits)
- **Business Rules:**
  - Max 3 payment methods per user
  - Payment method verification required before use

---

### 3.2 Project Management

#### 3.2.1 Project Creation

**FR-PM-001: Create Project**
- **Description:** Client creates a new project with milestones
- **Actors:** Client
- **Preconditions:** Client has verified account
- **Input:** 
  - Project title (max 100 chars)
  - Description (max 2000 chars)
  - Category (dropdown: Design, Development, Writing, Marketing, etc.)
  - Total budget
  - Timeline/deadline
  - Milestones (array)
- **Milestone Fields:**
  - Title (max 100 chars)
  - Description (max 500 chars)
  - Amount (USD)
  - Deadline (date)
  - Acceptance criteria (max 1000 chars)
- **Process:**
  1. Client clicks "Create Project"
  2. System displays project creation wizard (3 steps)
  3. Step 1: Basic details (title, description, category)
  4. Step 2: Define milestones (client can use AI suggestions or manual entry)
  5. Step 3: Review and confirm
  6. System validates total milestone amounts equal project budget
  7. System creates project with status "DRAFT"
  8. System generates unique project ID
- **Output:** Project created, redirects to project detail page
- **Validation Rules:**
  - At least 1 milestone required
  - Sum of milestone amounts must equal total budget
  - Each milestone amount must be > $50
  - Project budget must be $50 - $100,000 (Phase 1 limit)
  - Deadline must be at least 3 days in future
- **Error Handling:**
  - Budget mismatch: "Milestone amounts ($X) don't match project budget ($Y)"
  - Invalid amount: "Each milestone must be at least $50"

**FR-PM-002: Save Project as Draft**
- **Description:** Client can save incomplete project
- **Process:**
  1. Client clicks "Save as Draft" during creation
  2. System saves current state
  3. Client can resume editing later
- **Business Rules:**
  - Drafts auto-deleted after 30 days
  - Max 10 draft projects per user

**FR-PM-003: AI-Powered Milestone Suggestions**
- **Description:** System suggests optimal milestone structure
- **Input:** Project description, budget, category
- **Process:**
  1. Client enters project description
  2. Client clicks "Get AI Suggestions"
  3. System sends request to AI service
  4. AI analyzes description and category
  5. AI suggests: number of milestones, titles, payment splits, timeline
  6. System displays suggestions
  7. Client can accept, modify, or reject
- **Output:** Suggested milestone structure
- **Example Output:**
  - Milestone 1: "Initial Wireframes" - 20% ($400) - 5 days
  - Milestone 2: "High-Fidelity Designs" - 30% ($600) - 10 days
  - Milestone 3: "Final Deliverables & Revisions" - 50% ($1000) - 15 days

**FR-PM-004: Use Milestone Template**
- **Description:** Client can use pre-built templates
- **Available Templates:**
  - Logo Design (3 milestones: Concepts, Revisions, Final Files)
  - Website Development (5 milestones: Design, Frontend, Backend, Testing, Launch)
  - Content Writing (4 milestones: Outline, Draft, Revisions, Final)
  - Mobile App (6 milestones: Wireframes, Design, MVP, Testing, Beta, Release)
- **Process:**
  1. Client selects template
  2. System populates milestone structure
  3. Client adjusts amounts and deadlines
  4. Client can add/remove milestones

#### 3.2.2 Freelancer Invitation

**FR-PM-005: Invite Freelancer**
- **Description:** Client invites freelancer to project
- **Actors:** Client
- **Preconditions:** Project status is "DRAFT"
- **Input:** Freelancer email or Delivault username
- **Process:**
  1. Client completes project setup
  2. Client clicks "Invite Freelancer"
  3. Client enters freelancer email/username
  4. System checks if email exists on platform
  5. If exists: System sends in-app notification + email
  6. If not: System sends email with signup link
  7. System creates invitation record with unique token
  8. System updates project status to "PENDING_ACCEPTANCE"
- **Output:** Invitation sent
- **Business Rules:**
  - One freelancer per project (multi-party in Phase 2)
  - Invitation expires after 7 days
  - Client can cancel invitation before acceptance

**FR-PM-006: View Project Invitation**
- **Description:** Freelancer views project invitation
- **Actors:** Freelancer
- **Process:**
  1. Freelancer receives email/notification
  2. Freelancer clicks "View Project"
  3. System displays:
     - Project details
     - All milestone information
     - Client profile and rating
     - Payment terms and escrow details
     - Digital agreement terms
  4. Freelancer can accept or decline
- **Output:** Project invitation details displayed

**FR-PM-007: Accept Project Invitation**
- **Description:** Freelancer accepts project
- **Input:** Digital signature (checkbox "I agree to terms")
- **Process:**
  1. Freelancer reviews project details
  2. Freelancer clicks "Accept Project"
  3. System prompts for agreement confirmation
  4. System records acceptance timestamp
  5. System updates project status to "AWAITING_DEPOSIT"
  6. System notifies client
  7. System creates project activity log entry
- **Output:** Project accepted, client notified
- **Postconditions:** Client can now deposit funds

**FR-PM-008: Decline Project Invitation**
- **Description:** Freelancer declines project
- **Input:** Optional decline reason
- **Process:**
  1. Freelancer clicks "Decline"
  2. System prompts for optional feedback
  3. System updates invitation status to "DECLINED"
  4. System notifies client
  5. System updates project status back to "DRAFT"
- **Output:** Invitation declined, client notified

#### 3.2.3 Project Listing and Filtering

**FR-PM-009: View My Projects**
- **Description:** Users view their projects
- **For Clients:** Display projects they created
- **For Freelancers:** Display projects they're working on
- **Filters:**
  - Status (All, Active, Completed, Disputed, Cancelled)
  - Date range
  - Budget range
  - Search by title/description
- **Display Information:**
  - Project title
  - Freelancer/Client name and avatar
  - Status badge
  - Progress (X of Y milestones completed)
  - Total budget and amount paid
  - Last activity timestamp
- **Sorting Options:**
  - Most recent
  - Deadline (soonest first)
  - Budget (high to low)
  - Status

**FR-PM-010: View Project Details**
- **Description:** Users view comprehensive project information
- **Sections Displayed:**
  1. **Header:** Title, status badge, total budget, progress bar
  2. **Overview:** Description, category, deadline
  3. **Participants:** Client and freelancer profiles
  4. **Milestone Tracker:** Visual timeline with status indicators
  5. **Activity Feed:** Chronological log of all actions
  6. **Messages:** In-app chat interface
  7. **Files:** Uploaded deliverables and documents
  8. **Payment History:** Transaction records
- **Actions Available:**
  - Depends on user role and project status
  - Client: Review milestones, approve/request revisions, deposit funds
  - Freelancer: Submit milestones, upload deliverables
  - Both: Send messages, raise disputes

**FR-PM-011: Project Activity Feed**
- **Description:** Display chronological log of all project events
- **Events Logged:**
  - Project created
  - Invitation sent/accepted
  - Funds deposited
  - Milestone submitted
  - Milestone approved
  - Revision requested
  - Payment released
  - Message sent (count only, not content)
  - Dispute raised
  - Status changes
- **Format:** "John Doe submitted Milestone 2" - 2 hours ago
- **Business Rules:**
  - All events timestamped
  - Events immutable (audit trail)
  - Visible to both parties

---

### 3.3 Milestone Management

#### 3.3.1 Milestone Workflow

**FR-MS-001: View Milestone Details**
- **Description:** Users view detailed milestone information
- **Display:**
  - Title and description
  - Amount and deadline
  - Status with visual indicator
  - Acceptance criteria (checklist format)
  - Deliverables (if submitted)
  - Submission notes from freelancer
  - Revision history
  - Related messages
- **Status Indicators:**
  - Pending (gray) - Not started
  - In Progress (blue) - Freelancer working
  - Submitted (yellow) - Awaiting client review
  - Revision Requested (orange) - Needs changes
  - Approved (green) - Payment released
  - Disputed (red) - Under dispute

**FR-MS-002: Start Milestone**
- **Description:** Freelancer marks milestone as in progress
- **Actors:** Freelancer
- **Preconditions:** 
  - Previous milestone approved OR first milestone
  - Project status is "ACTIVE"
- **Process:**
  1. Freelancer clicks "Start Milestone"
  2. System updates status to "IN_PROGRESS"
  3. System logs start timestamp
  4. System notifies client
- **Business Rules:**
  - Only one milestone active at a time (sequential workflow)
  - Deadline countdown starts from this moment

**FR-MS-003: Submit Milestone**
- **Description:** Freelancer submits completed milestone
- **Actors:** Freelancer
- **Preconditions:** Milestone status is "IN_PROGRESS"
- **Input:**
  - Deliverables (file uploads or URLs)
  - Submission notes (optional, max 1000 chars)
  - Checklist confirmation (acceptance criteria items)
- **Process:**
  1. Freelancer clicks "Submit Milestone"
  2. System displays submission form
  3. Freelancer uploads files (max 5 files, 50MB total)
  4. Freelancer enters notes explaining deliverables
  5. Freelancer checks off acceptance criteria items
  6. Freelancer clicks "Submit for Review"
  7. System validates all required criteria checked
  8. System uploads files to storage (S3)
  9. System updates milestone status to "SUBMITTED"
  10. System logs submission timestamp
  11. System notifies client via email and in-app
  12. If AI deliverable matching enabled: System runs AI check
- **Output:** Milestone submitted, client notified
- **Validation Rules:**
  - At least 1 deliverable required (file or URL)
  - All mandatory acceptance criteria must be checked
  - Files: Accepted formats vary by project type
  - Notes: Max 1000 characters
- **AI Enhancement:**
  - System analyzes deliverables against acceptance criteria
  - Flags potential mismatches
  - Provides confidence score to client

**FR-MS-004: Review Milestone Submission**
- **Description:** Client reviews freelancer's submission
- **Actors:** Client
- **Preconditions:** Milestone status is "SUBMITTED"
- **Display:**
  - All deliverables with preview capability
  - Submission notes from freelancer
  - Acceptance criteria checklist
  - AI analysis results (if available)
  - Option to download all files as ZIP
- **Actions Available:**
  1. Approve
  2. Request Revision
  3. Raise Dispute
- **Process:**
  1. Client receives notification
  2. Client navigates to milestone
  3. System displays submission details
  4. Client reviews deliverables
  5. Client makes decision

**FR-MS-005: Approve Milestone**
- **Description:** Client approves milestone and releases payment
- **Actors:** Client
- **Preconditions:** Milestone status is "SUBMITTED"
- **Input:** Optional feedback/rating for this milestone
- **Process:**
  1. Client clicks "Approve Milestone"
  2. System confirms approval action
  3. System updates milestone status to "APPROVED"
  4. System logs approval timestamp
  5. System triggers payment release
  6. System transfers funds from escrow to freelancer account
  7. System updates project progress
  8. System notifies freelancer
  9. If final milestone: System updates project status to "COMPLETED"
- **Output:** Payment released, freelancer notified
- **Postconditions:** 
  - Payment appears in freelancer's balance
  - Next milestone becomes available (if exists)
- **Business Rules:**
  - Payment processed within 1-3 business days
  - Transaction fee deducted from payment
  - Invoice generated automatically

**FR-MS-006: Request Revision**
- **Description:** Client requests changes to submission
- **Actors:** Client
- **Preconditions:** Milestone status is "SUBMITTED"
- **Input:** 
  - Revision notes (required, max 1000 chars)
  - Specific issues with deliverables
  - Revised deadline (optional)
- **Process:**
  1. Client clicks "Request Revision"
  2. System displays revision form
  3. Client provides detailed feedback
  4. Client can attach reference files
  5. Client submits revision request
  6. System updates milestone status to "REVISION_REQUESTED"
  7. System logs revision request
  8. System notifies freelancer
  9. Freelancer can view revision notes and resubmit
- **Output:** Revision requested, freelancer notified
- **Business Rules:**
  - Max 3 revision rounds per milestone (configurable in project settings)
  - Each revision extends deadline by agreed days
  - Revision history tracked and visible
- **AI Enhancement:**
  - AI suggests specific, actionable feedback if client's notes are vague
  - "Your feedback is unclear. Did you mean: [suggestions]?"

**FR-MS-007: Auto-Approval**
- **Description:** System auto-approves milestone after timeout
- **Preconditions:** 
  - Milestone status is "SUBMITTED"
  - Client hasn't reviewed within specified period
- **Process:**
  1. Milestone submitted
  2. System starts timer (default 7 days, configurable 3-14 days)
  3. System sends reminder to client at 5 days, 1 day before
  4. If client doesn't act within period:
  5. System automatically approves milestone
  6. System releases payment
  7. System notifies both parties
  8. System logs as "AUTO_APPROVED"
- **Business Rules:**
  - Auto-approval period set during project creation
  - Client can disable auto-approval (requires manual approval)
  - Can be paused if client raises concerns before deadline

**FR-MS-008: Milestone Timeline Extension**
- **Description:** Parties mutually agree to extend deadline
- **Actors:** Freelancer (requests), Client (approves)
- **Process:**
  1. Freelancer clicks "Request Extension"
  2. Freelancer provides reason and proposed new deadline
  3. System notifies client
  4. Client can approve or deny
  5. If approved: System updates deadline
  6. Both parties notified
- **Business Rules:**
  - Max 2 extensions per milestone
  - Extension must be requested before deadline
  - Requires mutual agreement

---

### 3.4 Payment and Escrow Management

#### 3.4.1 Deposit to Escrow

**FR-PAY-001: Deposit Funds**
- **Description:** Client deposits project funds to escrow
- **Actors:** Client
- **Preconditions:** 
  - Project status is "AWAITING_DEPOSIT"
  - Client has verified payment method
- **Input:** Payment method selection
- **Process:**
  1. Client clicks "Deposit Funds"
  2. System calculates total:
     - Project budget: $X
     - Platform fee (2.5%): $Y
     - Payment processing fee (2.9% + $0.30): $Z
     - **Total: $X + $Y + $Z**
  3. System displays payment breakdown
  4. Client confirms payment method
  5. System creates Stripe Payment Intent
  6. Client enters payment details (if new card)
  7. Stripe processes payment
  8. System receives webhook confirmation
  9. System creates escrow record with status "HELD"
  10. System updates project status to "ACTIVE"
  11. System creates transaction record
  12. System notifies freelancer "Funds secured, you can start work"
- **Output:** Funds held in escrow, project activated
- **Error Handling:**
  - Payment declined: Display Stripe error message, allow retry
  - Insufficient funds: "Payment declined. Please use another card"
  - Technical error: "Payment failed. You have not been charged. Please try again"
- **Business Rules:**
  - Full amount must be deposited before work begins
  - Funds held in Delivault's Stripe account (or bank escrow account)
  - Funds cannot be withdrawn once deposited (except via milestone approval or refund)

**FR-PAY-002: Payment Method Management**
- **Description:** Client manages saved payment methods
- **Process:**
  1. Client navigates to Payment Settings
  2. Client can:
     - Add new card (via Stripe Elements)
     - Remove saved cards
     - Set default payment method
     - View last 4 digits of saved cards
  3. System stores payment methods via Stripe Customer API
- **Security:**
  - Never store full card numbers
  - PCI DSS compliance via Stripe
  - 3D Secure verification for high-value transactions

**FR-PAY-003: View Escrow Balance**
- **Description:** Display real-time escrow status
- **For Client:**
  - Total deposited
  - Amount released to milestones
  - Remaining in escrow
  - Pending releases
- **For Freelancer:**
  - Total project value
  - Earned to date
  - Pending approval
  - Available for withdrawal
- **Display:** Visual breakdown (pie chart or progress bar)

#### 3.4.2 Payment Release

**FR-PAY-004: Release Payment to Freelancer**
- **Description:** System transfers funds from escrow to freelancer
- **Trigger:** Milestone approved (FR-MS-005) or dispute resolved in freelancer's favor
- **Process:**
  1. Milestone status updated to "APPROVED"
  2. System validates escrow has sufficient funds
  3. System creates Stripe Transfer to freelancer's connected account
  4. Stripe processes transfer
  5. System receives webhook confirmation
  6. System updates payment record status to "RELEASED"
  7. System updates freelancer's available balance
  8. System generates invoice (PDF)
  9. System sends confirmation email to freelancer
  10. System logs transaction
- **Output:** Funds transferred to freelancer
- **Processing Time:**
  - Standard: 1-3 business days
  - Instant (premium, Phase 2): 1% fee, < 30 minutes
- **Business Rules:**
  - Platform fee (2.5%) deducted from milestone amount
  - Minimum payout: $50
  - Freelancer can accumulate multiple milestones before withdrawal

**FR-PAY-005: Withdraw Funds (Freelancer)**
- **Description:** Freelancer withdraws available balance
- **Actors:** Freelancer
- **Preconditions:** Available balance > $50
- **Input:** 
  - Payout method (bank account or PayPal)
  - Amount (can be partial)
- **Process:**
  1. Freelancer clicks "Withdraw"
  2. System displays available balance
  3. Freelancer enters withdrawal amount
  4. Freelancer selects payout method
  5. System validates payout method verified
  6. System initiates Stripe Payout
  7. Stripe processes to freelancer's bank
  8. System updates balance
  9. System sends confirmation
- **Output:** Funds sent to freelancer's bank/PayPal
- **Fees:**
  - Bank transfer: Free (standard 3-5 days)
  - Instant deposit: 1% (arrives within 30 mins)
  - PayPal: 2% of withdrawal amount
- **Limits:**
  - Min withdrawal: $50
  - Max per transaction: $50,000
  - Daily limit: $100,000

**FR-PAY-006: Refund to Client**
- **Description:** System refunds escrowed funds to client
- **Triggers:**
  - Freelancer doesn't accept project within 7 days
  - Project cancelled by mutual agreement
  - Dispute resolved in client's favor
  - Freelancer abandons project
- **Process:**
  1. Refund condition met
  2. System calculates refund amount (full or partial)
  3. System creates Stripe Refund
  4. Stripe processes refund to original payment method
  5. System updates escrow status to "REFUNDED"
  6. System logs transaction
  7. System notifies client
- **Output:** Funds returned to client's original payment method
- **Processing Time:** 5-10 business days (Stripe standard)
- **Fees:**
  - Platform fee: Refunded if project not started
  - Stripe processing fee: Not refundable (Stripe policy)

#### 3.4.3 Transaction History

**FR-PAY-007: View Transaction History**
- **Description:** Users view all financial transactions
- **Display:**
  - Date and time
  - Type (Deposit, Release, Withdrawal, Refund, Fee)
  - Project name
  - Amount
  - Status (Pending, Completed, Failed)
  - Invoice/receipt download link
- **Filters:**
  - Date range
  - Transaction type
  - Status
  - Project
- **Export:** Download as CSV or PDF for accounting

**FR-PAY-008: Generate Invoice**
- **Description:** System auto-generates invoices
- **Trigger:** Payment released to freelancer
- **Content:**
  - Invoice number (unique)
  - Date of issue
  - Client details (name, email)
  - Freelancer details (name, email, tax ID if provided)
  - Project name
  - Milestone description
  - Gross amount
  - Platform fee breakdown
  - Net amount
  - Payment method
- **Format:** PDF, downloadable and emailed
- **Business Rules:**
  - Invoice generated immediately upon payment release
  - Stored permanently for tax records
  - Accessible to both parties

**FR-PAY-009: Tax Reporting (US Users)**
- **Description:** Generate 1099 forms for US freelancers
- **Priority:** Phase 2
- **Preconditions:** 
  - Freelancer has US tax residency
  - Annual earnings > $600
- **Process:**
  1. System tracks annual earnings per freelancer
  2. Before January 31st, system generates 1099-NEC forms
  3. System sends forms to freelancers
  4. System files with IRS (via service provider)
- **Requirements:**
  - Freelancers must provide SSN/EIN
  - W-9 form collection

---

### 3.5 Messaging and Communication

#### 3.5.1 In-App Messaging

**FR-MSG-001: Send Message**
- **Description:** Users exchange messages within project context
- **Actors:** Client, Freelancer
- **Preconditions:** Project status is "ACTIVE"
- **Input:**
  - Message text (max 5000 chars)
  - Optional file attachments (max 5 files, 25MB total)
- **Process:**
  1. User types message in chat interface
  2. User can attach files (drag-drop or browse)
  3. User clicks "Send"
  4. System validates message content
  5. System uploads attachments to storage
  6. System saves message to database
  7. System broadcasts message via WebSocket
  8. System shows message immediately to sender