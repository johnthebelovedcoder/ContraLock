# Dispute Page Mock Data

This document provides information about the mock data for the dispute page in the Delivault application.

## Overview

The dispute page mock data includes comprehensive scenarios with realistic dispute situations, evidence, and communication logs. This allows for full testing and development of the dispute resolution functionality without requiring backend services.

## Mock Data Structure

The mock dispute data includes the following comprehensive scenarios:

1. **Design Specification Mismatch** - Dispute about delivered work not matching specifications
2. **Payment Processing Delay** - Dispute about payment not being processed after milestone completion
3. **Scope Creep** - Dispute about additional work requested outside original scope
4. **Timeline Extension** - Dispute about project timeline extension due to client delays
5. **Quality Issues** - Dispute about code quality and bugs in delivered work
6. **Deliverable Completion** - Dispute about whether deliverables were completed as agreed
7. **Freelancer Unresponsiveness** - Dispute about freelancer disappearing mid-project
8. **Scope Changes** - Dispute about significant scope changes after project initiation

## Data Features

Each mock dispute includes:

- Unique ID and status tracking
- Detailed reason for the dispute
- Evidence files with different types (PDF, PNG, ZIP, MP4, DOCX)
- Communication messages between parties
- AI analysis with confidence scores
- Resolution details where applicable
- Mediator and arbitrator assignments
- Dispute fee payment status
- Creation and update timestamps

## Available Statuses

- `PENDING_FEE` - Awaiting dispute fee payment
- `PENDING_REVIEW` - Awaiting initial review
- `SELF_RESOLUTION` - Parties attempting self-resolution
- `IN_MEDIATION` - In mediation phase
- `IN_ARBITRATION` - In arbitration phase
- `AWAITING_OUTCOME` - Resolution made, awaiting payment processing
- `RESOLVED` - Final resolution made and processed
- `ESCALATED` - Escalated to human review

## Service Methods

The mock dispute service provides the following methods:

- `getUserDisputes(userId, status?)` - Get disputes for a user with optional status filter
- `getDisputeById(disputeId)` - Get a specific dispute by ID
- `createDispute(disputeData)` - Create a new dispute
- `submitEvidence(disputeId, evidenceData)` - Submit evidence for a dispute
- `payDisputeFee(disputeId)` - Process dispute fee payment
- `submitAppeal(disputeId, appealData)` - Submit an appeal for a dispute
- `getDisputeStats(userId)` - Get statistics about user's disputes

## Usage

The mock data is automatically used when mock mode is enabled. To enable mock mode:

1. Set the `NEXT_PUBLIC_USE_MOCK_DATA` environment variable to `true`
2. Or set `useMockData` to `true` in localStorage
3. Or run in development mode (default)

The dispute page will automatically use mock data when mock mode is enabled, allowing for full functionality testing without backend services.

## File Locations

- `src/lib/mock-dispute-data.ts` - Contains the comprehensive mock dispute data
- `src/lib/mock-dispute-service.ts` - Contains the mock dispute service
- `src/lib/store/disputeStore.ts` - Dispute store with mock mode support
- `src/lib/api/messagingService.ts` - Messaging service with mock mode support
- `src/config/app-config.ts` - Application configuration including mock mode settings