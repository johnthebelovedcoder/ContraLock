import { User, Project, Milestone, Transaction, Invoice, EscrowAccount, Dispute, Notification } from '@/types';

// Mock user data
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'client@example.com',
    firstName: 'John',
    lastName: 'Client',
    role: 'client',
    status: 'verified',
    profile: {
      bio: 'Looking for development services',
      completed: true
    },
    paymentMethods: [
      {
        id: 'pm-1',
        userId: 'user-1',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expMonth: 12,
        expYear: 2027,
        isDefault: true,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2023-01-15'),
      },
      {
        id: 'pm-2',
        userId: 'user-1',
        type: 'crypto',
        cryptoType: 'bitcoin',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        isDefault: false,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
      },
      {
        id: 'pm-3',
        userId: 'user-1',
        type: 'bank',
        bankName: 'Chase Bank',
        last4: '6789',
        isDefault: false,
        createdAt: new Date('2023-06-10'),
        updatedAt: new Date('2023-06-10'),
      }
    ],
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
  },
  {
    id: 'user-2',
    email: 'freelancer@example.com',
    firstName: 'Jane',
    lastName: 'Freelancer',
    role: 'freelancer',
    status: 'verified',
    profile: {
      bio: 'Full-stack developer with 5 years experience',
      completed: true
    },
    paymentMethods: [
      {
        id: 'pm-4',
        userId: 'user-2',
        type: 'card',
        last4: '0812',
        brand: 'mastercard',
        expMonth: 8,
        expYear: 2026,
        isDefault: true,
        createdAt: new Date('2023-02-20'),
        updatedAt: new Date('2023-02-20'),
      },
      {
        id: 'pm-5',
        userId: 'user-2',
        type: 'crypto',
        cryptoType: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        isDefault: false,
        createdAt: new Date('2023-08-15'),
        updatedAt: new Date('2023-08-15'),
      }
    ],
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-02-20'),
  },
  {
    id: 'user-3',
    email: 'admin@contralock.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    status: 'verified',
    profile: {
      bio: 'System administrator',
      completed: true
    },
    paymentMethods: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  }
];

// Mock project data
export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'E-commerce Website Development',
    description: 'Complete e-commerce platform with payment integration and inventory management',
    category: 'Development',
    totalBudget: 500000, // $5000 in cents
    deadline: new Date('2024-06-30'),
    status: 'ACTIVE',
    clientId: 'user-1',
    freelancerId: 'user-2',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    progress: 45,
    pendingReviews: 1,
    messages: 12,
    escrowBalance: 425000, // $4250 in cents
    currency: 'USD',
    autoApproveDays: 7
  },
  {
    id: 'proj-2',
    title: 'Mobile App UI/UX Design',
    description: 'Design modern and intuitive user interface for fitness tracking mobile app',
    category: 'Design',
    totalBudget: 300000, // $3000 in cents
    deadline: new Date('2024-05-15'),
    status: 'PENDING_ACCEPTANCE',
    clientId: 'user-1',
    freelancerId: null,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    progress: 0,
    pendingReviews: 0,
    messages: 3,
    escrowBalance: 0, // $0 in cents
    currency: 'USD',
    autoApproveDays: 7
  },
  {
    id: 'proj-3',
    title: 'Content Writing for Tech Blog',
    description: 'Write 20 articles about latest tech trends for our company blog',
    category: 'Writing',
    totalBudget: 200000, // $2000 in cents
    deadline: new Date('2024-04-30'),
    status: 'COMPLETED',
    clientId: 'user-1',
    freelancerId: 'user-2',
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date('2024-01-10'),
    progress: 100,
    pendingReviews: 0,
    messages: 8,
    escrowBalance: 0, // $0 in cents
    currency: 'USD',
    autoApproveDays: 7
  },
  {
    id: 'proj-4',
    title: 'Blockchain Integration',
    description: 'Integrate blockchain technology for secure transactions',
    category: 'Development',
    totalBudget: 750000, // $7500 in cents
    deadline: new Date('2024-08-15'),
    status: 'AWAITING_DEPOSIT',
    clientId: 'user-1',
    freelancerId: 'user-2',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    progress: 0,
    pendingReviews: 0,
    messages: 5,
    escrowBalance: 0, // $0 in cents
    currency: 'BTC',
    autoApproveDays: 7
  },
  {
    id: 'proj-5',
    title: 'Marketing Strategy Consultation',
    description: 'Develop comprehensive marketing strategy for new product launch',
    category: 'Consulting',
    totalBudget: 400000, // $4000 in cents
    deadline: new Date('2024-07-20'),
    status: 'DRAFT',
    clientId: 'user-1',
    freelancerId: null,
    createdAt: new Date('2024-01-30'),
    updatedAt: new Date('2024-01-30'),
    progress: 0,
    pendingReviews: 0,
    messages: 1,
    escrowBalance: 0, // $0 in cents
    currency: 'USD',
    autoApproveDays: 7
  }
];

// Mock milestone data
export const mockMilestones: Milestone[] = [
  {
    id: 'ms-1',
    projectId: 'proj-1',
    title: 'Project Planning & Setup',
    description: 'Define project scope, setup development environment',
    amount: 100000, // $1000 in cents
    status: 'APPROVED',
    dueDate: new Date('2024-02-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-20'),
    acceptanceCriteria: 'Project plan approved, development environment ready',
    currency: 'USD',
    autoApproveCountdown: 0,
    deliverables: [
      {
        id: 'del-1',
        milestoneId: 'ms-1',
        fileName: 'Project_Plan_Document.pdf',
        fileType: 'application/pdf',
        fileSize: 1250000,
        fileUrl: '/documents/project-plan.pdf',
        isPreviewable: false,
        uploadedBy: 'user-2',
        uploadedAt: new Date('2024-02-18'),
        createdAt: new Date('2024-02-18'),
      },
      {
        id: 'del-2',
        milestoneId: 'ms-1',
        fileName: 'Dev_Environment_Setup_Guide.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 850000,
        fileUrl: '/documents/dev-setup-guide.docx',
        isPreviewable: false,
        uploadedBy: 'user-2',
        uploadedAt: new Date('2024-02-19'),
        createdAt: new Date('2024-02-19'),
      }
    ],
    submissionNotes: 'Project plan and development environment setup completed. Please review the attached documents.'
  },
  {
    id: 'ms-2',
    projectId: 'proj-1',
    title: 'Frontend Development',
    description: 'Create responsive frontend with React and TypeScript',
    amount: 200000, // $2000 in cents
    status: 'SUBMITTED',
    dueDate: new Date('2024-03-15'),
    createdAt: new Date('2024-02-16'),
    updatedAt: new Date('2024-03-16'),
    acceptanceCriteria: 'All components built and tested, responsive design implemented',
    currency: 'USD',
    autoApproveCountdown: 5,
    deliverables: [
      {
        id: 'del-3',
        milestoneId: 'ms-2',
        fileName: 'Frontend_Components.zip',
        fileType: 'application/zip',
        fileSize: 5242880,
        fileUrl: '/documents/frontend-components.zip',
        isPreviewable: false,
        uploadedBy: 'user-2',
        uploadedAt: new Date('2024-03-14'),
        createdAt: new Date('2024-03-14'),
      },
      {
        id: 'del-4',
        milestoneId: 'ms-2',
        fileName: 'Live_Demo_Link.txt',
        fileType: 'text/plain',
        fileSize: 1024,
        fileUrl: '/documents/demo-link.txt',
        isPreviewable: true,
        uploadedBy: 'user-2',
        uploadedAt: new Date('2024-03-15'),
        createdAt: new Date('2024-03-15'),
      }
    ],
    submissionNotes: 'All frontend components have been built and tested. Please check the live demo link for review.',
    submittedAt: new Date('2024-03-16')
  },
  {
    id: 'ms-3',
    projectId: 'proj-1',
    title: 'Backend API Development',
    description: 'Create REST API for e-commerce functionality',
    amount: 150000, // $1500 in cents
    status: 'IN_PROGRESS',
    dueDate: new Date('2024-04-15'),
    createdAt: new Date('2024-03-16'),
    updatedAt: new Date('2024-03-20'),
    acceptanceCriteria: 'API endpoints ready with proper authentication and error handling',
    currency: 'USD',
    autoApproveCountdown: 0,
    deliverables: [],
    submissionNotes: 'Currently working on API development. Will submit deliverables by deadline.'
  },
  {
    id: 'ms-4',
    projectId: 'proj-1',
    title: 'Payment Integration',
    description: 'Integrate secure payment processing',
    amount: 75000, // $750 in cents
    status: 'PENDING',
    dueDate: new Date('2024-05-15'),
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
    acceptanceCriteria: 'Payment processing working with test transactions',
    currency: 'USD',
    autoApproveCountdown: 0,
    deliverables: [],
    submissionNotes: 'Will begin work after previous milestone is approved.'
  },
  {
    id: 'ms-5',
    projectId: 'proj-3',
    title: 'Article Series: Tech Trends 2024',
    description: 'Write 20 articles about upcoming technology trends',
    amount: 200000, // $2000 in cents
    status: 'COMPLETED',
    dueDate: new Date('2024-01-10'),
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date('2024-01-10'),
    acceptanceCriteria: '20 high-quality articles delivered and approved',
    currency: 'USD',
    autoApproveCountdown: 0,
    deliverables: [
      {
        id: 'del-5',
        milestoneId: 'ms-5',
        fileName: 'Tech_Trends_Article_Series.zip',
        fileType: 'application/zip',
        fileSize: 10485760,
        fileUrl: '/documents/tech-trends-articles.zip',
        isPreviewable: false,
        uploadedBy: 'user-2',
        uploadedAt: new Date('2024-01-08'),
        createdAt: new Date('2024-01-08'),
      }
    ],
    submissionNotes: '20 articles on tech trends completed as per requirements. Ready for review and approval.',
    approvedAt: new Date('2024-01-10')
  }
];

// Mock transaction data
export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    projectId: 'proj-1',
    milestoneId: 'ms-1',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    type: 'DEPOSIT',
    amount: 119000, // $1190 (includes 1.9% client fee)
    currency: 'USD',
    amountInUsd: 119000,
    status: 'COMPLETED',
    paymentMethodId: 'pm-1',
    paymentMethodType: 'card',
    stripeIntentId: 'pi_123456',
    description: 'Initial deposit for project planning milestone',
    referenceId: 'ms-1',
    processedAt: new Date('2024-02-10'),
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    fees: {
      platform: 1900, // $19 (1.9% client fee)
      paymentProcessor: 3451, // $34.51 (2.9% + $0.30 on $1190)
      total: 5351 // $53.51 total fees
    }
  },
  {
    id: 'tx-2',
    projectId: 'proj-1',
    milestoneId: 'ms-2',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    type: 'RELEASE',
    amount: 192800, // $1928 (after 3.6% freelancer fee)
    currency: 'USD',
    amountInUsd: 192800,
    status: 'COMPLETED',
    paymentMethodId: 'pm-1',
    paymentMethodType: 'card',
    stripeIntentId: 'pi_234567',
    stripeTransferId: 'tr_234567',
    description: 'Payment release for frontend development',
    referenceId: 'ms-2',
    processedAt: new Date('2024-03-20'),
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
    fees: {
      platform: 7200, // $72 (3.6% freelancer fee on $2000 gross)
      paymentProcessor: 0,
      total: 7200
    }
  },
  {
    id: 'tx-3',
    projectId: 'proj-1',
    milestoneId: 'ms-3',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    type: 'FEE',
    amount: 5400, // $54 (3.6% freelancer fee on $1500 milestone)
    currency: 'USD',
    amountInUsd: 5400,
    status: 'COMPLETED',
    description: 'Platform fee from milestone payment',
    referenceId: 'ms-3',
    processedAt: new Date('2024-03-20'),
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
    fees: {
      platform: 5400,
      paymentProcessor: 0,
      total: 5400
    }
  },
  {
    id: 'tx-4',
    projectId: 'proj-3',
    milestoneId: 'ms-5',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    type: 'RELEASE',
    amount: 188000, // $1880 (after 3.6% freelancer fee)
    currency: 'USD',
    amountInUsd: 188000,
    status: 'COMPLETED',
    paymentMethodId: 'pm-1',
    paymentMethodType: 'card',
    stripeIntentId: 'pi_345678',
    stripeTransferId: 'tr_345678',
    description: 'Final payment for content writing project',
    referenceId: 'ms-5',
    processedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    fees: {
      platform: 7200, // $72 (3.6% freelancer fee on $2000 gross)
      paymentProcessor: 0,
      total: 7200
    }
  },
  {
    id: 'tx-5',
    projectId: 'proj-4',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    type: 'DEPOSIT',
    amount: 764250, // $7642.50 in crypto equivalent (includes 1.9% client fee on $7500)
    currency: 'BTC',
    amountInUsd: 764250,
    status: 'COMPLETED',
    paymentMethodId: 'pm-2',
    paymentMethodType: 'crypto',
    cryptoTxHash: 'abc123def456',
    cryptoNetwork: 'Bitcoin',
    description: 'Deposit for blockchain integration project (crypto)',
    referenceId: 'proj-4',
    processedAt: new Date('2024-01-26'),
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-26'),
    exchangeRate: 45000, // $45,000 per BTC
    exchangeRateTimestamp: new Date('2024-01-25'),
    fees: {
      platform: 14250, // $142.50 (1.9% client fee on $7500)
      paymentProcessor: 0, // Crypto fees are different
      total: 14250
    }
  },
  {
    id: 'tx-6',
    projectId: 'proj-4',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    type: 'DEPOSIT',
    amount: 125000, // $1250 in ETH equivalent
    currency: 'ETH',
    amountInUsd: 125000,
    status: 'COMPLETED',
    paymentMethodId: 'pm-5',
    paymentMethodType: 'crypto',
    cryptoTxHash: 'def456ghi789',
    cryptoNetwork: 'Ethereum',
    description: 'Additional deposit for blockchain integration project (ETH)',
    referenceId: 'proj-4',
    processedAt: new Date('2024-02-01'),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    exchangeRate: 2500, // $2,500 per ETH
    exchangeRateTimestamp: new Date('2024-02-01'),
    fees: {
      platform: 2500, // $25 (2% client fee on $1250)
      paymentProcessor: 0,
      total: 2500
    }
  },
  {
    id: 'tx-7',
    projectId: 'proj-1',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    type: 'WITHDRAWAL',
    amount: 150000, // $1500
    currency: 'USD',
    amountInUsd: 150000,
    status: 'COMPLETED',
    paymentMethodId: 'pm-4',
    paymentMethodType: 'card',
    stripeIntentId: 'pi_567890',
    description: 'Withdrawal to freelancer card',
    referenceId: 'withdrawal-1',
    processedAt: new Date('2024-03-25'),
    createdAt: new Date('2024-03-24'),
    updatedAt: new Date('2024-03-25'),
    fees: {
      platform: 0,
      paymentProcessor: 450, // $4.50 (3% on $150)
      total: 450
    }
  }
];

// Mock Invoice data
export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    projectId: 'proj-1',
    milestoneId: 'ms-1',
    clientId: 'user-1',
    freelancerId: 'user-2',
    grossAmount: 100000, // $1000 in cents
    platformFee: 5500, // $55 (5.5% total platform fee)
    netAmount: 94500, // $945 (after freelancer fee)
    status: 'PAID',
    dueDate: new Date('2024-02-28'),
    issuedDate: new Date('2024-02-10'),
    invoiceNumber: 'INV-001',
    paymentMethod: 'CREDIT_CARD',
    pdfUrl: '/invoices/inv-001.pdf',
    currency: 'USD',
    client: {
      name: 'John Client',
      email: 'client@example.com',
      address: '123 Main St, Anytown, USA'
    },
    freelancer: {
      name: 'Jane Freelancer',
      email: 'freelancer@example.com',
      taxId: '123-45-6789'
    },
    items: [
      {
        description: 'Project Planning & Setup',
        quantity: 1,
        unitPrice: 100000,
        total: 100000
      }
    ],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: 'inv-2',
    projectId: 'proj-1',
    milestoneId: 'ms-2',
    clientId: 'user-1',
    freelancerId: 'user-2',
    grossAmount: 200000, // $2000 in cents
    platformFee: 11000, // $110 (5.5% total platform fee)
    netAmount: 188000, // $1880 (after freelancer fee)
    status: 'PAID',
    dueDate: new Date('2024-03-31'),
    issuedDate: new Date('2024-03-20'),
    invoiceNumber: 'INV-002',
    paymentMethod: 'CREDIT_CARD',
    pdfUrl: '/invoices/inv-002.pdf',
    currency: 'USD',
    client: {
      name: 'John Client',
      email: 'client@example.com',
      address: '123 Main St, Anytown, USA'
    },
    freelancer: {
      name: 'Jane Freelancer',
      email: 'freelancer@example.com',
      taxId: '123-45-6789'
    },
    items: [
      {
        description: 'Frontend Development',
        quantity: 1,
        unitPrice: 200000,
        total: 200000
      }
    ],
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: 'inv-3',
    projectId: 'proj-3',
    milestoneId: 'ms-5',
    clientId: 'user-1',
    freelancerId: 'user-2',
    grossAmount: 200000, // $2000 in cents
    platformFee: 11000, // $110 (5.5% total platform fee)
    netAmount: 188000, // $1880 (after freelancer fee)
    status: 'PAID',
    dueDate: new Date('2024-01-24'),
    issuedDate: new Date('2024-01-10'),
    invoiceNumber: 'INV-003',
    paymentMethod: 'CREDIT_CARD',
    pdfUrl: '/invoices/inv-003.pdf',
    currency: 'USD',
    client: {
      name: 'John Client',
      email: 'client@example.com',
      address: '123 Main St, Anytown, USA'
    },
    freelancer: {
      name: 'Jane Freelancer',
      email: 'freelancer@example.com',
      taxId: '123-45-6789'
    },
    items: [
      {
        description: 'Article Series: Tech Trends 2024',
        quantity: 20,
        unitPrice: 10000,
        total: 200000
      }
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'inv-4',
    projectId: 'proj-4',
    milestoneId: 'ms-1',
    clientId: 'user-1',
    freelancerId: 'user-2',
    grossAmount: 500000, // $5000 in cents
    platformFee: 9500, // $95 (1.9% client fee)
    netAmount: 475000, // $4750 (after 5% freelancer fee)
    status: 'PENDING',
    dueDate: new Date('2024-02-20'),
    issuedDate: new Date('2024-01-28'),
    invoiceNumber: 'INV-004',
    paymentMethod: 'CRYPTO',
    pdfUrl: '/invoices/inv-004.pdf',
    currency: 'BTC',
    exchangeRate: 45000, // $45,000 per BTC
    client: {
      name: 'John Client',
      email: 'client@example.com',
      address: '123 Main St, Anytown, USA'
    },
    freelancer: {
      name: 'Jane Freelancer',
      email: 'freelancer@example.com',
      taxId: '123-45-6789'
    },
    items: [
      {
        description: 'Blockchain Integration - Phase 1',
        quantity: 1,
        unitPrice: 500000,
        total: 500000
      }
    ],
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-01-28'),
  },
  {
    id: 'inv-5',
    projectId: 'proj-1',
    milestoneId: 'ms-3',
    clientId: 'user-1',
    freelancerId: 'user-2',
    grossAmount: 150000, // $1500 in cents
    platformFee: 8100, // $81 (5.4% total fees)
    netAmount: 141900, // $1419 (after freelancer fee)
    status: 'DRAFT',
    dueDate: new Date('2024-04-20'),
    issuedDate: new Date('2024-03-25'),
    invoiceNumber: 'INV-005',
    paymentMethod: 'BANK_TRANSFER',
    pdfUrl: '/invoices/inv-005.pdf',
    currency: 'USD',
    client: {
      name: 'John Client',
      email: 'client@example.com',
      address: '123 Main St, Anytown, USA'
    },
    freelancer: {
      name: 'Jane Freelancer',
      email: 'freelancer@example.com',
      taxId: '123-45-6789'
    },
    items: [
      {
        description: 'Backend API Development',
        quantity: 1,
        unitPrice: 150000,
        total: 150000
      }
    ],
    createdAt: new Date('2024-03-25'),
    updatedAt: new Date('2024-03-25'),
  }
];

// Mock Escrow Account data
export const mockEscrowAccounts: EscrowAccount[] = [
  {
    id: 'escrow-1',
    projectId: 'proj-1',
    clientId: 'user-1',
    freelancerId: 'user-2',
    totalAmount: 500000, // $5000 in cents
    heldAmount: 325000, // $3250 in cents (after first milestone release)
    releasedAmount: 175000, // $1750 in cents (first two milestones)
    status: 'HELD',
    platformFee: 11000, // $110 in cents
    paymentProcessingFee: 5500, // $55 in cents
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: 'escrow-2',
    projectId: 'proj-3',
    clientId: 'user-1',
    freelancerId: 'user-2',
    totalAmount: 200000, // $2000 in cents
    heldAmount: 0, // $0 in cents
    releasedAmount: 200000, // $2000 in cents (completed project)
    status: 'RELEASED',
    platformFee: 11000, // $110 in cents
    paymentProcessingFee: 5500, // $55 in cents
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'escrow-3',
    projectId: 'proj-4',
    clientId: 'user-1',
    freelancerId: 'user-2',
    totalAmount: 750000, // $7500 in cents
    heldAmount: 750000, // $7500 in cents (pending deposit)
    releasedAmount: 0, // $0 in cents
    status: 'NOT_DEPOSITED',
    platformFee: 0, // $0 in cents
    paymentProcessingFee: 0, // $0 in cents
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  }
];

// Mock Dispute data
export const mockDisputes: Dispute[] = [
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

// Mock Notification data
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'MILESTONE_SUBMITTED',
    title: 'Milestone Submitted for Review',
    message: 'Jane Freelancer submitted "Frontend Development" for your review.',
    projectId: 'proj-1',
    read: false,
    createdAt: new Date('2024-03-16'),
  },
  {
    id: 'notif-2',
    userId: 'user-2',
    type: 'MILESTONE_APPROVED',
    title: 'Milestone Approved',
    message: 'Your "Project Planning & Setup" milestone has been approved by John Client.',
    projectId: 'proj-1',
    read: true,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 'notif-3',
    userId: 'user-2',
    type: 'PAYMENT_RELEASED',
    title: 'Payment Released',
    message: '$1,928.00 has been released to your account for the "Frontend Development" milestone.',
    projectId: 'proj-1',
    read: true,
    createdAt: new Date('2024-03-20'),
  },
  {
    id: 'notif-4',
    userId: 'user-1',
    type: 'DISPUTE_SUBMITTED',
    title: 'Dispute Filed',
    message: 'A dispute has been filed for milestone "Frontend Development".',
    projectId: 'proj-1',
    read: false,
    createdAt: new Date('2024-03-18'),
  },
  {
    id: 'notif-5',
    userId: 'user-2',
    type: 'PROJECT_INVITATION',
    title: 'Project Invitation',
    message: 'You have been invited to join "Mobile App UI/UX Design".',
    projectId: 'proj-2',
    read: false,
    createdAt: new Date('2024-01-22'),
  },
  {
    id: 'notif-6',
    userId: 'user-1',
    type: 'MILESTONE_EXPIRING',
    title: 'Milestone Auto-Approval',
    message: 'Milestone "Frontend Development" will auto-approve in 5 days if no action is taken.',
    projectId: 'proj-1',
    read: false,
    createdAt: new Date('2024-03-16'),
  }
];

// Utility functions to generate mock data
export const generateMockUser = (overrides?: Partial<User>): User => {
  const baseUser: User = {
    id: `user-${Date.now()}`,
    email: `user${Date.now()}@example.com`,
    firstName: 'Mock',
    lastName: 'User',
    role: 'client',
    status: 'verified',
    profile: {
      bio: 'Mock user profile',
      completed: true
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { ...baseUser, ...overrides };
};

export const generateMockProject = (overrides?: Partial<Project>): Project => {
  const baseProject: Project = {
    id: `proj-${Date.now()}`,
    title: 'Mock Project',
    description: 'This is a mock project for testing',
    category: 'Development',
    totalBudget: 100000, // $1000 in cents
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'DRAFT',
    clientId: 'user-1',
    freelancerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 0,
    pendingReviews: 0,
    messages: 0,
    escrowBalance: 0,
    currency: 'USD',
    autoApproveDays: 7
  };

  return { ...baseProject, ...overrides };
};

export const generateMockMilestone = (overrides?: Partial<Milestone>): Milestone => {
  const baseMilestone: Milestone = {
    id: `ms-${Date.now()}`,
    projectId: 'proj-1',
    title: 'Mock Milestone',
    description: 'This is a mock milestone for testing',
    amount: 100000, // $1000 in cents
    status: 'PENDING',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    acceptanceCriteria: 'Complete the deliverables as specified',
    currency: 'USD',
    autoApproveCountdown: 0
  };

  return { ...baseMilestone, ...overrides };
};

export const generateMockTransaction = (overrides?: Partial<Transaction>): Transaction => {
  const baseTransaction: Transaction = {
    id: `tx-${Date.now()}`,
    projectId: 'proj-1',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    type: 'DEPOSIT',
    amount: 100000, // $1000 in cents
    status: 'PENDING',
    description: 'Mock transaction',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { ...baseTransaction, ...overrides };
};

// Getters for mock data
export const getMockUsers = (): User[] => [...mockUsers];
export const getMockProjects = (): Project[] => [...mockProjects];
export const getMockMilestones = (): Milestone[] => [...mockMilestones];
export const getMockTransactions = (): Transaction[] => [...mockTransactions];
export const getMockInvoices = (): Invoice[] => [...mockInvoices];
export const getMockEscrowAccounts = (): EscrowAccount[] => [...mockEscrowAccounts];
export const getMockDisputes = (): Dispute[] => [...mockDisputes];
export const getMockNotifications = (): Notification[] => [...mockNotifications];

// Mock communication data
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    projectId: 'proj-1',
    participants: ['user-1', 'user-2'],
    unreadCount: 2,
    lastMessage: 'Can you provide an update on the front-end development?',
    lastMessageAt: new Date('2024-03-20T10:30:00'),
    isArchived: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: 'conv-2',
    projectId: 'proj-2',
    participants: ['user-1', 'user-2'],
    unreadCount: 0,
    lastMessage: 'I will send the initial design mockups by end of week',
    lastMessageAt: new Date('2024-01-25T15:45:00'),
    isArchived: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: 'conv-3',
    projectId: 'proj-3',
    participants: ['user-1', 'user-2'],
    unreadCount: 0,
    lastMessage: 'Thank you for the excellent work on the content series!',
    lastMessageAt: new Date('2024-01-10T09:15:00'),
    isArchived: true,
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'conv-4',
    projectId: 'proj-4',
    participants: ['user-1', 'user-2'],
    unreadCount: 1,
    lastMessage: 'Have you started the blockchain integration yet?',
    lastMessageAt: new Date('2024-01-28T14:20:00'),
    isArchived: false,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-28'),
  }
];

export const mockMessages: Message[] = [
  // Messages for project 1 conversation
  {
    id: 'msg-1',
    projectId: 'proj-1',
    senderId: 'user-1',
    senderRole: 'client',
    content: 'Hi there, I wanted to check on the progress of the e-commerce project.',
    type: 'TEXT',
    status: 'READ',
    readBy: ['user-2'],
    sentAt: new Date('2024-01-16T09:00:00'),
    createdAt: new Date('2024-01-16T09:00:00'),
    updatedAt: new Date('2024-01-16T09:00:00'),
  },
  {
    id: 'msg-2',
    projectId: 'proj-1',
    senderId: 'user-2',
    senderRole: 'freelancer',
    content: 'Hello! I\'ve completed the project planning and setup milestone. Ready to move to frontend development.',
    type: 'TEXT',
    status: 'READ',
    readBy: ['user-1'],
    sentAt: new Date('2024-02-16T11:30:00'),
    createdAt: new Date('2024-02-16T11:30:00'),
    updatedAt: new Date('2024-02-16T11:30:00'),
  },
  {
    id: 'msg-3',
    projectId: 'proj-1',
    senderId: 'user-1',
    senderRole: 'client',
    content: 'Great! Please start on the frontend development. I\'ve released the funds for this milestone.',
    type: 'TEXT',
    status: 'READ',
    readBy: ['user-2'],
    sentAt: new Date('2024-02-17T14:45:00'),
    createdAt: new Date('2024-02-17T14:45:00'),
    updatedAt: new Date('2024-02-17T14:45:00'),
  },
  {
    id: 'msg-4',
    projectId: 'proj-1',
    senderId: 'user-2',
    senderRole: 'freelancer',
    content: 'Working on the frontend components. Should have a demo ready by next week.',
    type: 'TEXT',
    status: 'READ',
    readBy: ['user-1'],
    sentAt: new Date('2024-03-05T10:15:00'),
    createdAt: new Date('2024-03-05T10:15:00'),
    updatedAt: new Date('2024-03-05T10:15:00'),
  },
  {
    id: 'msg-5',
    projectId: 'proj-1',
    senderId: 'user-2',
    senderRole: 'freelancer',
    content: 'Here\'s a quick update: I\'ve completed 80% of the frontend development. I\'ll submit the milestone by the deadline.',
    type: 'TEXT',
    status: 'DELIVERED',
    readBy: ['user-1'],
    sentAt: new Date('2024-03-15T16:20:00'),
    createdAt: new Date('2024-03-15T16:20:00'),
    updatedAt: new Date('2024-03-15T16:20:00'),
  },
  {
    id: 'msg-6',
    projectId: 'proj-1',
    senderId: 'user-1',
    senderRole: 'client',
    content: 'Can you provide an update on the front-end development?',
    type: 'TEXT',
    status: 'SENT',
    readBy: [],
    sentAt: new Date('2024-03-20T10:30:00'),
    createdAt: new Date('2024-03-20T10:30:00'),
    updatedAt: new Date('2024-03-20T10:30:00'),
  },

  // Messages for project 2 conversation
  {
    id: 'msg-7',
    projectId: 'proj-2',
    senderId: 'user-1',
    senderRole: 'client',
    content: 'Hi, I wanted to discuss the UI/UX design project.',
    type: 'TEXT',
    status: 'READ',
    readBy: ['user-2'],
    sentAt: new Date('2024-01-21T10:00:00'),
    createdAt: new Date('2024-01-21T10:00:00'),
    updatedAt: new Date('2024-01-21T10:00:00'),
  },
  {
    id: 'msg-8',
    projectId: 'proj-2',
    senderId: 'user-2',
    senderRole: 'freelancer',
    content: 'Hello! I\'ve reviewed the project requirements. I should be able to provide initial mockups by end of week.',
    type: 'TEXT',
    status: 'READ',
    readBy: ['user-1'],
    sentAt: new Date('2024-01-22T15:30:00'),
    createdAt: new Date('2024-01-22T15:30:00'),
    updatedAt: new Date('2024-01-22T15:30:00'),
  },
  {
    id: 'msg-9',
    projectId: 'proj-2',
    senderId: 'user-2',
    senderRole: 'freelancer',
    content: 'I will send the initial design mockups by end of week',
    type: 'TEXT',
    status: 'READ',
    readBy: ['user-1'],
    sentAt: new Date('2024-01-25T15:45:00'),
    createdAt: new Date('2024-01-25T15:45:00'),
    updatedAt: new Date('2024-01-25T15:45:00'),
  },

  // Messages for project 4 conversation
  {
    id: 'msg-10',
    projectId: 'proj-4',
    senderId: 'user-1',
    senderRole: 'client',
    content: 'Have you started the blockchain integration yet?',
    type: 'TEXT',
    status: 'DELIVERED',
    readBy: ['user-2'],
    sentAt: new Date('2024-01-28T14:20:00'),
    createdAt: new Date('2024-01-28T14:20:00'),
    updatedAt: new Date('2024-01-28T14:20:00'),
  },
  {
    id: 'msg-11',
    projectId: 'proj-4',
    senderId: 'user-2',
    senderRole: 'freelancer',
    content: 'Yes, I\'m currently researching the best blockchain solutions for your use case.',
    type: 'TEXT',
    status: 'READ',
    readBy: ['user-1'],
    sentAt: new Date('2024-01-29T09:15:00'),
    createdAt: new Date('2024-01-29T09:15:00'),
    updatedAt: new Date('2024-01-29T09:15:00'),
  }
];

// Getters for communication mock data
export const getMockConversations = (): Conversation[] => [...mockConversations];
export const getMockMessages = (): Message[] => [...mockMessages];