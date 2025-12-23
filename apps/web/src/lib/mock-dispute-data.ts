import { Dispute } from '@/types';

// Enhanced mock dispute data for the dispute page
export const mockDisputeData: Dispute[] = [
  {
    _id: 'disp-001',
    project: 'proj-1',
    milestone: 'ms-1',
    raisedBy: 'user-1',
    reason: 'Delivered work does not match the design specifications provided',
    evidence: [
      {
        filename: 'design-specs.pdf',
        url: '/evidence/design-specs.pdf',
        type: 'application/pdf',
        uploadedBy: 'user-1'
      },
      {
        filename: 'screenshot-mismatch.png',
        url: '/evidence/screenshot-mismatch.png',
        type: 'image/png',
        uploadedBy: 'user-1'
      },
      {
        filename: 'requirements-document.docx',
        url: '/evidence/requirements-document.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedBy: 'user-1'
      }
    ],
    status: 'PENDING_REVIEW',
    resolutionPhase: 'REVIEW',
    aiAnalysis: {
      confidenceScore: 0.75,
      keyIssues: ['Design specification mismatch', 'Quality concerns'],
      recommendedResolution: 'REVISION_REQUIRED',
      reasoning: 'Analysis shows significant deviation from provided design specifications'
    },
    mediator: null,
    arbitrator: null,
    resolution: null,
    messages: [
      {
        sender: 'user-1',
        content: 'The delivered work does not match the design specifications we agreed upon. Please review the attached documents showing the discrepancies.',
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        sender: 'user-3',
        content: 'I understand your concerns. I will review the specifications and provide a detailed response within 24 hours.',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      }
    ],
    disputeFeePaid: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'disp-002',
    project: 'proj-2',
    milestone: 'ms-5',
    raisedBy: 'user-2',
    reason: 'Payment not processed after milestone completion and approval',
    evidence: [
      {
        filename: 'milestone-approval-email.pdf',
        url: '/evidence/milestone-approval-email.pdf',
        type: 'application/pdf',
        uploadedBy: 'user-2'
      },
      {
        filename: 'delivered-work.zip',
        url: '/evidence/delivered-work.zip',
        type: 'application/zip',
        uploadedBy: 'user-2'
      }
    ],
    status: 'IN_MEDIATION',
    resolutionPhase: 'MEDIATION',
    aiAnalysis: {
      confidenceScore: 0.90,
      keyIssues: ['Payment processing delay', 'Completed work verification'],
      recommendedResolution: 'PAYMENT_RELEASE',
      reasoning: 'Milestone was completed and approved, payment should be released'
    },
    mediator: 'user-4',
    arbitrator: null,
    resolution: null,
    messages: [
      {
        sender: 'user-2',
        content: 'I completed the milestone and received approval from the client, but the payment has not been processed after 7 days.',
        sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'user-1',
        content: 'I approved the work but there was a system issue that prevented payment processing. Working with support to resolve.',
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'user-4',
        content: 'I will mediate this dispute and ensure payment is processed within 48 hours.',
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    disputeFeePaid: true,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'disp-003',
    project: 'proj-3',
    milestone: 'ms-3',
    raisedBy: 'user-3',
    reason: 'Client requested additional work not included in original scope',
    evidence: [
      {
        filename: 'original-contract.pdf',
        url: '/evidence/original-contract.pdf',
        type: 'application/pdf',
        uploadedBy: 'user-3'
      },
      {
        filename: 'scope-creep-requests.png',
        url: '/evidence/scope-creep-requests.png',
        type: 'image/png',
        uploadedBy: 'user-3'
      }
    ],
    status: 'RESOLVED',
    resolutionPhase: 'RESOLVED',
    aiAnalysis: {
      confidenceScore: 0.85,
      keyIssues: ['Scope creep', 'Additional requirements'],
      recommendedResolution: 'PARTIAL_PAYMENT',
      reasoning: 'Original scope was completed, additional work requires separate agreement'
    },
    mediator: null,
    arbitrator: 'admin-1',
    resolution: {
      decision: 'PARTIAL_PAYMENT',
      amountToFreelancer: 125000, // $1,250 in cents
      amountToClient: 0,
      decisionReason: 'Original scope completed as agreed, additional work outside contract',
      decidedBy: 'admin-1',
      decidedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      aiRecommended: true
    },
    messages: [
      {
        sender: 'user-3',
        content: 'Client requested multiple features not included in the original contract. This is scope creep.',
        sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'user-5',
        content: 'I believe these features are necessary for the project to function as intended.',
        sentAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'admin-1',
        content: 'After review, the original scope was completed. Additional features require a new agreement.',
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    disputeFeePaid: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'disp-004',
    project: 'proj-4',
    milestone: 'ms-7',
    raisedBy: 'user-6',
    reason: 'Timeline extension requested due to client delays in providing required materials',
    evidence: [
      {
        filename: 'communication-log.pdf',
        url: '/evidence/communication-log.pdf',
        type: 'application/pdf',
        uploadedBy: 'user-6'
      },
      {
        filename: 'delay-justification.png',
        url: '/evidence/delay-justification.png',
        type: 'image/png',
        uploadedBy: 'user-6'
      }
    ],
    status: 'ESCALATED',
    resolutionPhase: 'ESCALATION',
    aiAnalysis: {
      confidenceScore: 0.65,
      keyIssues: ['Timeline delays', 'Client responsiveness'],
      recommendedResolution: 'TIMELINE_EXTENSION',
      reasoning: 'Client delays affected project timeline, extension justified'
    },
    mediator: 'user-7',
    arbitrator: null,
    resolution: null,
    messages: [
      {
        sender: 'user-6',
        content: 'I need a timeline extension due to delays in receiving required materials from the client.',
        sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'user-8',
        content: 'I disagree with the timeline extension request. The materials were provided on time.',
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'user-7',
        content: 'Escalating to senior arbitrator for final decision.',
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    disputeFeePaid: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'disp-005',
    project: 'proj-5',
    milestone: 'ms-9',
    raisedBy: 'user-9',
    reason: 'Quality issues with delivered code - contains multiple bugs',
    evidence: [
      {
        filename: 'bug-report.pdf',
        url: '/evidence/bug-report.pdf',
        type: 'application/pdf',
        uploadedBy: 'user-9'
      },
      {
        filename: 'debugging-session.mp4',
        url: '/evidence/debugging-session.mp4',
        type: 'video/mp4',
        uploadedBy: 'user-9'
      }
    ],
    status: 'IN_ARBITRATION',
    resolutionPhase: 'ARBITRATION',
    aiAnalysis: {
      confidenceScore: 0.80,
      keyIssues: ['Code quality', 'Bugs and errors'],
      recommendedResolution: 'REWORK_REQUIRED',
      reasoning: 'Delivered code has significant quality issues that need to be addressed'
    },
    mediator: null,
    arbitrator: 'admin-2',
    resolution: null,
    messages: [
      {
        sender: 'user-9',
        content: 'The delivered code has multiple bugs and quality issues. Please review the attached bug report.',
        sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'user-10',
        content: 'I acknowledge the issues and am working on fixes. Will provide updated code within 48 hours.',
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'admin-2',
        content: 'Case moved to arbitration for final decision on quality standards.',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    disputeFeePaid: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'disp-006',
    project: 'proj-6',
    milestone: 'ms-12',
    raisedBy: 'user-11',
    reason: 'Payment dispute - client claims deliverables were not completed as agreed',
    evidence: [
      {
        filename: 'completed-deliverables.zip',
        url: '/evidence/completed-deliverables.zip',
        type: 'application/zip',
        uploadedBy: 'user-11'
      },
      {
        filename: 'client-feedback.png',
        url: '/evidence/client-feedback.png',
        type: 'image/png',
        uploadedBy: 'user-11'
      }
    ],
    status: 'AWAITING_OUTCOME',
    resolutionPhase: 'AWAITING_DECISION',
    aiAnalysis: {
      confidenceScore: 0.70,
      keyIssues: ['Deliverable completion', 'Payment obligation'],
      recommendedResolution: 'PARTIAL_PAYMENT',
      reasoning: 'Most deliverables completed but some requirements not fully met'
    },
    mediator: null,
    arbitrator: 'admin-3',
    resolution: null,
    messages: [
      {
        sender: 'user-11',
        content: 'I have completed all agreed deliverables. Payment is overdue.',
        sentAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'user-12',
        content: 'Some deliverables are incomplete and do not meet our standards.',
        sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'admin-3',
        content: 'Currently reviewing all deliverables and will issue decision within 48 hours.',
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    disputeFeePaid: true,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'disp-007',
    project: 'proj-7',
    milestone: 'ms-4',
    raisedBy: 'user-13',
    reason: 'Freelancer disappeared mid-project without notice',
    evidence: [
      {
        filename: 'communication-attempt-log.pdf',
        url: '/evidence/communication-attempt-log.pdf',
        type: 'application/pdf',
        uploadedBy: 'user-13'
      },
      {
        filename: 'project-status.png',
        url: '/evidence/project-status.png',
        type: 'image/png',
        uploadedBy: 'user-13'
      }
    ],
    status: 'PENDING_FEE',
    resolutionPhase: 'INITIAL',
    aiAnalysis: null,
    mediator: null,
    arbitrator: null,
    resolution: null,
    messages: [
      {
        sender: 'user-13',
        content: 'Freelancer has not responded to messages for 5 days and has not completed the agreed work.',
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    disputeFeePaid: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'disp-008',
    project: 'proj-8',
    milestone: 'ms-15',
    raisedBy: 'user-14',
    reason: 'Scope changed significantly after project initiation',
    evidence: [
      {
        filename: 'initial-scope.pdf',
        url: '/evidence/initial-scope.pdf',
        type: 'application/pdf',
        uploadedBy: 'user-14'
      },
      {
        filename: 'scope-change-requests.pdf',
        url: '/evidence/scope-change-requests.pdf',
        type: 'application/pdf',
        uploadedBy: 'user-14'
      }
    ],
    status: 'SELF_RESOLUTION',
    resolutionPhase: 'NEGOTIATION',
    aiAnalysis: {
      confidenceScore: 0.60,
      keyIssues: ['Scope changes', 'Project requirements'],
      recommendedResolution: 'NEGOTIATION',
      reasoning: 'Both parties should negotiate new terms for changed scope'
    },
    mediator: null,
    arbitrator: null,
    resolution: null,
    messages: [
      {
        sender: 'user-14',
        content: 'The project scope has changed significantly from the original agreement. Need to discuss revised terms.',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'user-15',
        content: 'Agreed. Let\'s schedule a call to discuss the new scope and timeline.',
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    disputeFeePaid: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Export a function to get mock disputes
export const getMockDisputes = (): Dispute[] => [...mockDisputeData];

// Export functions for different dispute statuses
export const getOpenDisputes = (): Dispute[] => 
  mockDisputeData.filter(dispute => 
    dispute.status !== 'RESOLVED' && 
    dispute.status !== 'AWAITING_OUTCOME' && 
    dispute.status !== 'PENDING_FEE'
  );

export const getResolvedDisputes = (): Dispute[] => 
  mockDisputeData.filter(dispute => dispute.status === 'RESOLVED');

export const getPendingDisputes = (): Dispute[] => 
  mockDisputeData.filter(dispute => 
    dispute.status === 'PENDING_REVIEW' || 
    dispute.status === 'PENDING_FEE'
  );

export const getInMediationDisputes = (): Dispute[] => 
  mockDisputeData.filter(dispute => dispute.status === 'IN_MEDIATION');

export const getDisputesByStatus = (status: string): Dispute[] => 
  mockDisputeData.filter(dispute => dispute.status === status);

// Export a function to get a single dispute by ID
export const getMockDisputeById = (id: string): Dispute | undefined => 
  mockDisputeData.find(dispute => dispute._id === id);