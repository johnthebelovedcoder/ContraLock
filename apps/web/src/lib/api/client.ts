import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { handleApiError, logError } from '../utils/errorHandler';
import { mockConfig } from '@/config/mock-config';
import {
  getMockProjects,
  getMockMilestones,
  getMockTransactions,
  getMockNotifications,
  getMockConversations,
  getMockMessages,
  getMockDisputes
} from '../mock-data';

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Create a unique key for each request to identify duplicates
function getRequestKey(url: string, method: string, data?: any): string {
  const normalizedMethod = method.toUpperCase();
  // For GET requests, we only consider URL since they shouldn't have request body
  // For other methods, we also consider the data
  if (normalizedMethod === 'GET') {
    return `${normalizedMethod}-${url}`;
  }

  // For other methods, include the data to differentiate requests to the same endpoint
  // but with different payloads
  const dataString = data ? JSON.stringify(data) : '';
  return `${normalizedMethod}-${url}-${dataString}`;
}

// Configuration to enable/disable mock mode
// Check both environment variable and localStorage setting
const USE_MOCK_DATA = mockConfig.useMockData;

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = USE_MOCK_DATA
      ? 'http://mock-api' // Placeholder for mock API
      : API_BASE_URL;

    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        logError(error, 'API_REQUEST');
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Log the error for debugging
        logError(error, 'API_RESPONSE');

        // Handle unauthorized access
        if (error.response?.status === 401) {
          // Only redirect if not using mock data
          if (!USE_MOCK_DATA) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/auth/login';
          }
        }

        // Let the calling function handle the error
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods with error handling and request deduplication for GET requests
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (USE_MOCK_DATA) {
      // Return mock data for specific endpoints
      if (url.includes('/projects')) {
        // Simulate API response structure for projects
        const projects = getMockProjects();
        return {
          data: {
            items: projects,
            total: projects.length,
            page: 1,
            limit: 10
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/milestones')) {
        const milestones = getMockMilestones();
        return {
          data: milestones as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/transactions')) {
        const transactions = getMockTransactions();
        return {
          data: transactions as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/notifications')) {
        const notifications = getMockNotifications();
        return {
          data: notifications as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/messaging/conversations')) {
        // Extract userId from the URL
        const pathParts = url.split('/');
        let userId = pathParts[pathParts.length - 1];

        // Handle case where URL is just `/messaging/conversations` without userId
        if (userId === 'conversations' || !userId) {
          userId = 'user-1'; // Default to user-1 for demo purposes
        }

        // Get all mock conversations
        let allConversations = getMockConversations();

        // Filter conversations where the user is a participant (by user ID)
        const userConversations = allConversations.filter(conv =>
          conv.participants.includes(userId)
        );

        // Enhance conversations with participant details
        // The component expects participant objects with id, name, and role
        const enhancedConversations = userConversations.map(conv => {
          // Get participant details (in real app this would come from user service)
          const participantDetails = [
            { id: 'user-1', name: 'John Client', role: 'client' },
            { id: 'user-2', name: 'Jane Freelancer', role: 'freelancer' }
          ];

          // Create enhanced conversation with participant objects
          return {
            ...conv,
            participants: participantDetails, // Replace with full participant objects
            projectName: getMockProjects().find(p => p.id === conv.projectId)?.title || `Project ${conv.projectId}`
          };
        });

        return {
          data: enhancedConversations as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/projects') && url.includes('/milestones')) {
        // Handle project milestones endpoint - extract projectId from URL
        const pathParts = url.split('/');
        const projectId = pathParts[pathParts.length - 2]; // /projects/{projectId}/milestones

        // Filter milestones by project ID
        const milestones = getMockMilestones().filter(ms => ms.projectId === projectId);

        return {
          data: milestones as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/messaging/messages')) {
        // Extract projectId from the URL (handle both /messages and /messages/{projectId})
        const pathParts = url.split('/');
        let projectId = pathParts[pathParts.length - 1];

        // If it's just '/messaging/messages' endpoint, projectId will be 'messages'
        // In that case, we'll get all messages regardless of project
        if (projectId === 'messages') {
          projectId = ''; // Set to empty to get all messages
        } else if (pathParts.includes('messages') && projectId) {
          // Handle /messaging/messages/{projectId}
          // projectId is already correctly extracted
        }

        // Filter messages by project ID if provided
        const allMessages = getMockMessages();
        const messages = projectId
          ? allMessages.filter(msg => msg.projectId === projectId)
          : allMessages;

        return {
          data: {
            items: messages,
            total: messages.length,
            page: 1,
            limit: 50
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/milestones') && !url.includes('/projects')) {
        // Handle getting specific milestone by ID - extract milestoneId from URL
        const pathParts = url.split('/');
        const milestoneId = pathParts[pathParts.length - 1]; // /milestones/{milestoneId}

        // Find the specific milestone by ID
        const milestone = getMockMilestones().find(ms => ms.id === milestoneId);

        if (!milestone) {
          // If not found, return an error response
          return {
            data: { error: 'Milestone not found' } as any,
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        }

        return {
          data: milestone as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/auth/me')) {
        // Mock current user response - determine role based on email in token or localStorage
        // For demo purposes, we'll check the email from a stored value or default to client
        let userEmail = 'client@example.com';
        let userRole = 'client';
        let userId = 'user-1';
        let firstName = 'John';
        let lastName = 'Client';

        // Try to determine the user from stored token or other context
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
          try {
            // First, check if our mock token contains email info (format: mock_access_token_{email})
            if (storedToken.includes('mock_access_token_')) {
              const emailFromToken = storedToken.replace('mock_access_token_', '');
              if (emailFromToken && emailFromToken !== 'mock_access_token_') {
                userEmail = emailFromToken;
                // Determine role based on email pattern
                if (userEmail.includes('freelancer')) {
                  userRole = 'freelancer';
                  firstName = 'Test';
                  lastName = 'Freelancer';
                } else if (userEmail.includes('admin')) {
                  userRole = 'admin';
                  firstName = 'Admin';
                  lastName = 'User';
                }
              }
            } else {
              // For standard JWT tokens, decode the payload
              const tokenParts = storedToken.split('.');
              if (tokenParts.length === 3) {
                // Add padding if needed
                let payload = tokenParts[1];
                payload += '='.repeat((4 - payload.length % 4) % 4);
                const decodedPayload = JSON.parse(atob(payload));

                // If the token has user info, use it
                if (decodedPayload.email) {
                  userEmail = decodedPayload.email;
                  // Determine role based on email pattern
                  if (userEmail.includes('freelancer')) {
                    userRole = 'freelancer';
                    firstName = 'Test';
                    lastName = 'Freelancer';
                  } else if (userEmail.includes('admin')) {
                    userRole = 'admin';
                    firstName = 'Admin';
                    lastName = 'User';
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Could not decode token to determine user role:', e);
          }
        }

        // Also check if we have user data in localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData.email) userEmail = userData.email;
            if (userData.role) userRole = userData.role;
            if (userData.firstName) firstName = userData.firstName;
            if (userData.lastName) lastName = userData.lastName;
            if (userData.id) userId = userData.id;
          } catch (e) {
            console.warn('Could not parse stored user data:', e);
          }
        }

        return {
          data: {
            id: userId,
            email: userEmail,
            firstName: firstName,
            lastName: lastName,
            role: userRole,
            status: 'verified',
            profile: {
              bio: userRole === 'freelancer'
                ? 'Test freelancer for development'
                : 'Looking for development services',
              completed: true
            },
            createdAt: new Date('2023-01-15'),
            updatedAt: new Date('2023-01-15'),
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/users/')) {
        // Handle user endpoints
        if (url.includes('/kyc')) {
          // Mock KYC verification response
          return {
            data: {
              id: 'kyc-1',
              userId: 'user-1',
              verificationStatus: 'VERIFIED',
              documentType: 'PASSPORT',
              documentId: 'DOC123456',
              verifiedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/payment-methods')) {
          // Mock payment methods response
          return {
            data: [
              {
                id: 'pm-1',
                userId: 'user-1',
                type: 'CREDIT_CARD',
                last4: '1234',
                brand: 'Visa',
                expMonth: 12,
                expYear: 2027,
                isDefault: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            ] as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/balance')) {
          // Mock balance response
          return {
            data: {
              userId: 'user-1',
              availableBalance: 500000, // $5000.00 in cents
              pendingBalance: 20000, // $200.00 in cents
              currency: 'USD',
              lastUpdated: new Date().toISOString(),
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else {
          // Mock user by ID response
          const pathParts = url.split('/');
          const userId = pathParts[pathParts.length - 1].split('?')[0]; // Remove query params if any

          return {
            data: {
              id: userId || 'user-1',
              email: 'user@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: 'client',
              status: 'verified',
              profile: {
                bio: 'Sample user profile',
                completed: true
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        }
      } else if (url.includes('/projects/activities')) {
        // Mock project activities
        const pathParts = url.split('/');
        const projectId = pathParts[pathParts.indexOf('projects') + 1];

        return {
          data: {
            items: [
              {
                id: 'activity-1',
                projectId: projectId,
                type: 'MILESTONE_SUBMITTED',
                description: 'Milestone "Project Planning" submitted for review',
                timestamp: new Date().toISOString(),
                userId: 'user-2',
                relatedId: 'ms-1',
              }
            ],
            total: 1,
            page: 1,
            limit: 10
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/payments/escrow/')) {
        // Mock escrow account response
        const pathParts = url.split('/');
        const projectId = pathParts[pathParts.length - 1];

        return {
          data: {
            id: `escrow-${projectId}`,
            projectId: projectId,
            clientId: 'user-1',
            freelancerId: 'user-2',
            totalAmount: 500000, // $5000.00 in cents
            heldAmount: 350000, // $3500.00 in cents
            releasedAmount: 150000, // $1500.00 in cents
            status: 'HELD',
            platformFee: 10000, // $100.00 in cents
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/payments/transactions')) {
        // Mock transactions response (if not already handled)
        const transactions = getMockTransactions();
        return {
          data: {
            items: transactions,
            total: transactions.length,
            page: 1,
            limit: 50
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/payments/balance/')) {
        // Mock balance response - extract userId from URL
        const pathParts = url.split('/');
        const userId = pathParts[pathParts.length - 1];

        return {
          data: {
            userId: userId,
            availableBalance: 500000, // $5000.00 in cents
            totalBalance: 750000,     // $7500.00 in cents
            lockedBalance: 250000,    // $2500.00 in cents
            currency: 'USD',
            lastUpdated: new Date().toISOString(),
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/payments/payouts')) {
        // Mock payouts response
        return {
          data: [
            {
              id: 'payout-1',
              userId: 'user-2',
              amount: 100000, // $1000.00 in cents
              status: 'PROCESSING',
              method: 'BANK_TRANSFER',
              scheduledAt: new Date().toISOString(),
              processedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ] as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/payments/methods')) {
        // Handle GET and POST for payment methods
        if (config?.method?.toUpperCase() === 'POST') {
          // Mock adding a new payment method
          const pathParts = url.split('/');
          const userId = pathParts[pathParts.length - 1]; // Extract userId from /payments/methods/{userId}

          // Create a new payment method based on the type
          const newPaymentMethod: any = {
            id: `pm-${Date.now()}`,
            userId: userId,
            isDefault: false, // Will be set to true if this is the first method
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data, // Include all data from the request
          };

          // Set type-specific fields if not already set
          if (!newPaymentMethod.type) {
            newPaymentMethod.type = data?.type || 'card';
          }

          // If this is the first payment method, make it default
          // In a real scenario, we'd check existing methods, but for mock we'll just make first ones default
          if (Math.random() > 0.5) { // Randomly decide if it's default for demo purposes
            newPaymentMethod.isDefault = true;
          }

          return {
            data: newPaymentMethod as any,
            status: 201,
            statusText: 'Created',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else {
          // Mock payment methods response (GET)
          return {
            data: [
              {
                id: 'pm-1',
                userId: 'user-1',
                type: 'card',
                last4: '1234',
                brand: 'Visa',
                expMonth: 12,
                expYear: 2027,
                isDefault: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'pm-2',
                userId: 'user-1',
                type: 'crypto',
                currency: 'BTC',
                walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                isDefault: false,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              }
            ] as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        }
      } else if (url.includes('/api/v1/notifications') || url.includes('/notifications')) {
        // Mock notifications response (if not already handled)
        const notifications = getMockNotifications();
        return {
          data: {
            items: notifications,
            total: notifications.length,
            page: 1,
            limit: 50
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/search')) {
        // Handle search endpoints (projects, users)
        if (url.includes('/projects/search')) {
          const projects = getMockProjects();
          return {
            data: {
              items: projects,
              total: projects.length,
              page: 1,
              limit: 10
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/users/search')) {
          const users = getMockUsers();
          return {
            data: {
              items: users,
              total: users.length,
              page: 1,
              limit: 10
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        }
      } else if (url.includes('/messaging/disputes')) {
        // Handle dispute-related endpoints
        if (url.includes('/resolution')) {
          // Mock dispute resolution response
          return {
            data: {
              id: 'res-1',
              disputeId: 'disp-1',
              resolvedBy: 'admin-1',
              resolverRole: 'arbitrator',
              decision: 'CLIENT_FAVOR',
              clientAmount: 150000, // $1500.00 in cents
              freelancerAmount: 0, // $0.00 in cents
              decisionNotes: 'Client provided sufficient evidence',
              rationale: 'Based on the evidence provided, the decision favors the client',
              decisionDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/report')) {
          // Mock dispute report response
          return {
            data: {
              id: 'disp-1',
              summary: 'Dispute report for testing',
              parties: ['client-1', 'freelancer-1'],
              evidenceCount: 2,
              communications: 5,
              status: 'RESOLVED',
              resolutionSummary: 'Resolved in favor of client',
              createdAt: new Date().toISOString(),
              resolvedAt: new Date().toISOString(),
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else {
          // Mock disputes list
          const disputes = getMockDisputes();

          // Check if this is a paginated request (has query params)
          const urlObj = new URL(`http://example.com${url}`);
          const page = parseInt(urlObj.searchParams.get('page') || '1');
          const limit = parseInt(urlObj.searchParams.get('limit') || '20');
          const userId = urlObj.searchParams.get('userId');
          const status = urlObj.searchParams.get('status');

          // Filter disputes by userId if provided (filter by who raised the dispute)
          let filteredDisputes = disputes;
          if (userId) {
            filteredDisputes = disputes.filter(dispute =>
              typeof dispute.raisedBy === 'string'
                ? dispute.raisedBy === userId
                : (dispute.raisedBy as any)?.id === userId
            );
          }

          // Filter by status if provided
          if (status) {
            filteredDisputes = filteredDisputes.filter(dispute =>
              dispute.status === status
            );
          }

          // Apply pagination
          const startIndex = (page - 1) * limit;
          const paginatedDisputes = filteredDisputes.slice(startIndex, startIndex + limit);

          // Check if the URL is requesting a paginated response or direct array
          if (url.includes('page=') || url.includes('limit=')) {
            // Return paginated response
            return {
              data: {
                items: paginatedDisputes,
                total: filteredDisputes.length,
                page,
                limit
              } as any,
              status: 200,
              statusText: 'OK',
              headers: {},
              config: config || {}
            } as AxiosResponse<T>;
          } else {
            // Return array directly for compatibility with getDisputes method
            return {
              data: paginatedDisputes as any,
              status: 200,
              statusText: 'OK',
              headers: {},
              config: config || {}
            } as AxiosResponse<T>;
          }
        }
      } else if (url.includes('/ai/')) {
        // Handle AI service endpoints
        if (url.includes('/ai/milestone-suggestions')) {
          // Mock milestone suggestions
          const mockSuggestions = {
            suggestedMilestones: [
              {
                title: 'Project Planning & Setup',
                description: 'Initial project setup, requirements review, and technical architecture',
                amount: (data?.budget || 1000) * 0.2, // 20% of budget
                deadlineDays: 5
              },
              {
                title: 'Initial Deliverables',
                description: 'Core features/components development',
                amount: (data?.budget || 1000) * 0.5, // 50% of budget
                deadlineDays: 10
              },
              {
                title: 'Review & Revisions',
                description: 'Client review, feedback incorporation, and revisions',
                amount: (data?.budget || 1000) * 0.2, // 20% of budget
                deadlineDays: 5
              },
              {
                title: 'Final Delivery',
                description: 'Final implementation, testing, and delivery',
                amount: (data?.budget || 1000) * 0.1, // 10% of budget
                deadlineDays: 3
              }
            ],
            confidenceScore: 92,
            recommendations: [
              `For ${data?.category || 'Development'} projects, it's recommended to have more frequent checkpoints`,
              'Consider adding buffer time for revisions in your timeline'
            ]
          };

          return {
            data: mockSuggestions as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/ai/verify-deliverable')) {
          // Mock deliverable verification
          const mockVerification = {
            confidenceScore: 87,
            feedback: [
              "The deliverable meets most of the acceptance criteria",
              "Some minor adjustments needed for full compliance"
            ],
            recommendation: "request_revision", // approve, request_revision, dispute
            specificFeedback: [
              "Main functionality implemented correctly",
              "Documentation needs improvement",
              "Minor UI inconsistencies with requirements"
            ]
          };

          return {
            data: mockVerification as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/ai/dispute-analysis')) {
          // Mock dispute analysis
          const mockAnalysis = {
            confidenceLevel: 78,
            keyIssues: [
              "Deliverable does not match initial specifications",
              "Communication breakdown regarding requirements",
              "Timeline discrepancies"
            ],
            recommendedResolution: {
              decision: "partial_payment", // full_payment, partial_payment, refund, revision_needed
              amountToFreelancer: 75000, // in cents
              amountToClient: 25000 // in cents
            },
            reasoning: "Analysis shows the freelancer delivered substantial work but failed to meet some critical acceptance criteria. Recommend partial payment to balance fairness to both parties.",
            suggestions: [
              "Implement more detailed acceptance criteria in future projects",
              "Establish clearer communication protocols"
            ]
          };

          return {
            data: mockAnalysis as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/ai/pricing-advice')) {
          // Mock pricing advice
          const mockAdvice = {
            recommendedPrice: (data?.projectDescription?.length || 100) * 50,
            marketComparison: {
              averagePrice: 1500,
              percentile: "65th percentile",
              recommendation: "Slightly above market rate, justified by requirements"
            },
            suggestions: [
              "Consider breaking into smaller milestones for better risk management",
              "Add buffer for scope changes"
            ]
          };

          return {
            data: mockAdvice as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/ai/contract-audit')) {
          // Mock contract audit
          const mockAudit = {
            issuesFound: 3,
            severity: "medium",
            flaggedSections: [
              {
                section: "Payment Terms",
                issue: "Vague language around milestone payments",
                suggestion: "Define specific payment triggers"
              },
              {
                section: "Scope of Work",
                issue: "Missing definition of deliverables",
                suggestion: "Add detailed deliverable descriptions"
              },
              {
                section: "Revisions",
                issue: "No limit on number of revisions",
                suggestion: "Limit to 2-3 rounds of revisions"
              }
            ],
            overallScore: 7.5,
            recommendations: [
              "Add termination clauses",
              "Define acceptance criteria more clearly"
            ]
          };

          return {
            data: mockAudit as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/ai/communication-summary')) {
          // Mock communication summary
          const mockSummary = {
            summary: "The conversation revolves around timeline adjustments and deliverable expectations. Both parties agree on the core requirements but have different views on the implementation approach.",
            sentiment: "neutral",
            keyPoints: [
              "Timeline needs adjustment",
              "Deliverable expectations clarified",
              "Payment schedule confirmed"
            ],
            actionItems: [
              "Client to provide additional requirements by Friday",
              "Freelancer to provide updated timeline by Monday"
            ],
            suggestedResponse: "Thank you for the clarification. I'll review the additional requirements and provide an updated timeline by Monday."
          };

          return {
            data: mockSummary as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        }
      } else if (url.includes('/admin/')) {
        // Handle admin endpoints
        if (url.includes('/dashboard')) {
          return {
            data: {
              totalUsers: 150,
              totalProjects: 85,
              totalTransactions: 234,
              totalDisputes: 5,
              revenue: 1250000, // $12,500.00 in cents
              activeProjects: 23,
              recentActivity: [
                { id: 'act-1', type: 'PROJECT_CREATED', description: 'New project created', timestamp: new Date().toISOString() },
                { id: 'act-2', type: 'PAYMENT_PROCESSED', description: 'Payment of $500 processed', timestamp: new Date().toISOString() },
              ]
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/users')) {
          const users = getMockUsers();
          return {
            data: {
              items: users,
              total: users.length,
              page: 1,
              limit: 10
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/projects')) {
          const projects = getMockProjects();
          return {
            data: {
              items: projects,
              total: projects.length,
              page: 1,
              limit: 10
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/analytics/summary')) {
          return {
            data: {
              totalRevenue: 1250000, // $12,500.00 in cents
              activeUsers: 85,
              completedProjects: 67,
              avgProjectTime: 14, // days
              disputeRate: 2.3, // percentage
              userGrowth: 15, // percentage
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        } else if (url.includes('/transactions')) {
          const transactions = getMockTransactions();
          return {
            data: {
              items: transactions,
              total: transactions.length,
              page: 1,
              limit: 10
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        }
      } else if (url.includes('/files/download') || url.includes('/invoices/')) {
        // Handle file download endpoints
        return {
          data: {
            message: 'File download would start in real implementation',
            downloadUrl: url,
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      }
      // Add more endpoints as needed
    }

    // For GET requests, implement deduplication
    const requestKey = getRequestKey(url, 'GET');

    if (pendingRequests.has(requestKey)) {
      // If request is already in flight, return the existing promise
      return pendingRequests.get(requestKey);
    }

    // Make the new request
    const requestPromise = this.client.get<T>(url, config)
      .then(response => {
        // Clean up after request completes successfully
        pendingRequests.delete(requestKey);
        return response;
      })
      .catch(error => {
        // Clean up after request fails
        pendingRequests.delete(requestKey);
        const processedError = handleApiError(error);
        // Re-throw with processed error data
        return Promise.reject(processedError);
      });

    // Store the pending promise
    pendingRequests.set(requestKey, requestPromise);

    return requestPromise;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (USE_MOCK_DATA) {
      // Handle specific POST endpoints with mocks
      if (url.includes('/projects') && !url.includes('/invite') && !url.includes('/accept-invitation') && !url.includes('/decline-invitation')) {
        // Simulate project creation
        return {
          data: {
            id: `proj-${Date.now()}`,
            title: data?.title || 'New Project',
            description: data?.description || 'Project description',
            category: data?.category || 'Development',
            totalBudget: data?.totalBudget || 100000,
            deadline: data?.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'DRAFT',
            clientId: data?.clientId || 'user-1',
            freelancerId: data?.freelancerId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            progress: 0,
            pendingReviews: 0,
            messages: 0,
            escrowBalance: 0,
            currency: data?.currency || 'USD',
            autoApproveDays: data?.autoApprovalPeriod || 7,
            ...data,
          } as any,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/milestones') && url.includes('/submit')) {
        // Simulate milestone submission
        const milestoneId = url.split('/')[2]; // Extract milestone ID from URL
        return {
          data: {
            id: milestoneId,
            status: 'SUBMITTED',
            submissionNotes: data?.submissionNotes || '',
            deliverables: data?.deliverables || [],
            submittedAt: new Date().toISOString(),
            ...data,
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/milestones') && !url.includes('/start') && !url.includes('/approve') && !url.includes('/revision') && !url.includes('/dispute') && !url.includes('/submit')) {
        // Simulate milestone creation
        return {
          data: {
            id: `ms-${Date.now()}`,
            projectId: data?.projectId || 'proj-1',
            title: data?.title || 'New Milestone',
            description: data?.description || 'Milestone description',
            amount: data?.amount || 100000,
            status: 'PENDING',
            dueDate: data?.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            acceptanceCriteria: data?.acceptanceCriteria || 'Complete the deliverables',
            currency: data?.currency || 'USD',
            autoApproveCountdown: 0,
            ...data,
          } as any,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/auth/login')) {
        // Mock login response - determine role based on login credentials
        const email = data?.email || 'client@example.com';
        let userRole = 'client';
        let firstName = 'John';
        let lastName = 'Client';

        // Determine role based on email
        if (email.includes('freelancer')) {
          userRole = 'freelancer';
          firstName = 'Test';
          lastName = 'Freelancer';
        } else if (email.includes('admin')) {
          userRole = 'admin';
          firstName = 'Admin';
          lastName = 'User';
        }

        // Store user info in localStorage for later retrieval
        const mockUser = {
          id: 'user-1',
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: userRole,
          status: 'verified',
          profile: {
            bio: userRole === 'freelancer'
              ? 'Test freelancer for development'
              : 'Looking for development services',
            completed: true
          },
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date('2023-01-15'),
        };

        // Store user data for retrieval by /auth/me endpoint
        localStorage.setItem('currentUser', JSON.stringify(mockUser));

        return {
          data: {
            user: mockUser,
            accessToken: `mock_access_token_${email}`, // Include email in token for decoding
            refreshToken: `mock_refresh_token_${email}`,
            expiresIn: 3600
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/auth/register')) {
        // Mock registration response
        return {
          data: {
            user: {
              id: `user-${Date.now()}`,
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              role: data.role,
              status: 'pending_verification',
              profile: {
                bio: '',
                completed: false
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            expiresIn: 3600
          } as any,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/auth/change-password')) {
        return {
          data: {
            success: true
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/auth/forgot-password')) {
        return {
          data: {
            success: true,
            message: 'Password reset instructions sent to your email'
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/auth/reset-password')) {
        return {
          data: {
            user: {
              id: 'user-1',
              email: 'client@example.com',
              firstName: 'John',
              lastName: 'Client',
              role: 'client',
            },
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            expiresIn: 3600
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/auth/verify-email')) {
        return {
          data: {
            success: true,
            message: 'Email verified successfully'
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/projects/accept-invitation')) {
        // Mock invitation acceptance
        return {
          data: {
            id: 'proj-1',
            title: 'Sample Project',
            description: 'Sample project description',
            status: 'ACTIVE',
            clientId: 'user-1',
            freelancerId: 'user-2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/projects/decline-invitation')) {
        return {
          data: {
            success: true,
            message: 'Invitation declined successfully'
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/projects/invitations/freelancer/')) {
        // Mock invitations for freelancer
        const pathParts = url.split('/');
        const freelancerId = pathParts[pathParts.length - 1];

        // Return mock invitations data
        return {
          data: [
            {
              id: 'inv-1',
              projectId: 'proj-4',
              projectTitle: 'Logo Design Project',
              clientName: 'Acme Inc',
              clientEmail: 'contact@acme.com',
              status: 'PENDING',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              token: 'token-12345',
            },
            {
              id: 'inv-2',
              projectId: 'proj-5',
              projectTitle: 'Brand Identity Package',
              clientName: 'Tech Startup Co',
              clientEmail: 'hello@techstartup.co',
              status: 'PENDING',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              token: 'token-67890',
            },
            {
              id: 'inv-3',
              projectId: 'proj-6',
              projectTitle: 'Landing Page Development',
              clientName: 'Marketing Firm',
              clientEmail: 'projects@marketingfirm.com',
              status: 'ACCEPTED',
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Expired
              acceptedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
              token: 'token-abcde',
            },
            {
              id: 'inv-4',
              projectId: 'proj-7',
              projectTitle: 'SEO Optimization',
              clientName: 'E-commerce Store',
              clientEmail: 'admin@ecommercestore.com',
              status: 'DECLINED',
              createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Expired
              declinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              token: 'token-fghij',
            },
            {
              id: 'inv-5',
              projectId: 'proj-8',
              projectTitle: 'Social Media Strategy',
              clientName: 'Consulting Group',
              clientEmail: 'info@consultinggroup.com',
              status: 'EXPIRED',
              createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Expired
              token: 'token-klmno',
            },
            {
              id: 'inv-6',
              projectId: 'proj-9',
              projectTitle: 'Content Writing Package',
              clientName: 'Blog Network',
              clientEmail: 'editor@blognetwork.com',
              status: 'PENDING',
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              token: 'token-pqrst',
            }
          ] as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/projects/invite')) {
        // Handle project invitation
        return {
          data: {
            success: true,
            message: `Invitation sent to ${data?.email || 'freelancer'}`
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/milestones/') && url.includes('/start')) {
        // Mock milestone start
        const pathParts = url.split('/');
        const milestoneId = pathParts[pathParts.length - 2]; // /milestones/{id}/start

        return {
          data: {
            id: milestoneId,
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/milestones/') && url.includes('/approve')) {
        // Mock milestone approval
        const pathParts = url.split('/');
        const milestoneId = pathParts[pathParts.length - 2]; // /milestones/{id}/approve

        return {
          data: {
            id: milestoneId,
            status: 'APPROVED',
            approvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            feedback: data?.feedback,
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/milestones/') && url.includes('/revision')) {
        // Mock milestone revision request
        const pathParts = url.split('/');
        const milestoneId = pathParts[pathParts.length - 2]; // /milestones/{id}/revision

        return {
          data: {
            id: milestoneId,
            status: 'REVISION_REQUESTED',
            revisionNotes: data?.revisionNotes,
            updatedAt: new Date().toISOString(),
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/messaging/send')) {
        // Mock sending a message
        return {
          data: {
            id: `msg-${Date.now()}`,
            projectId: data?.projectId || 'proj-1',
            senderId: 'user-1',
            senderRole: 'client',
            content: data?.content || 'Sample message',
            type: data?.type || 'TEXT',
            status: 'SENT',
            isSystemMessage: false,
            attachments: data?.attachments || [],
            readBy: [],
            sentAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data,
          } as any,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/messaging/messages/') && url.includes('/read')) {
        // Mock marking message as read
        const pathParts = url.split('/');
        const messageId = pathParts[pathParts.length - 2]; // /messages/{id}/read

        return {
          data: {
            id: messageId,
            read: true,
            readAt: new Date().toISOString(),
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/messaging/conversations/') && url.includes('/read')) {
        // Mock marking conversation as read
        const pathParts = url.split('/');
        const conversationId = pathParts[pathParts.length - 2]; // /conversations/{id}/read

        return {
          data: {
            id: conversationId,
            read: true,
            readAt: new Date().toISOString(),
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/payments/deposit')) {
        // Mock deposit funds
        return {
          data: {
            id: `deposit-${Date.now()}`,
            transactionId: `tx-${Date.now()}`,
            projectId: data?.projectId || 'proj-1',
            amount: data?.amount || 100000,
            status: 'PENDING',
            paymentMethodId: data?.paymentMethodId || 'pm-1',
            description: data?.description || 'Deposit to escrow',
            processedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/change-proposals')) {
        // Mock change proposal creation
        return {
          data: {
            id: `change-${Date.now()}`,
            projectId: data?.projectId || 'proj-1',
            milestoneId: data?.milestoneId,
            reason: data?.reason || 'Change request',
            originalValues: data?.originalValues || {},
            proposedValues: data?.proposedValues || {},
            status: 'PENDING_REVIEW',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/projects/') && url.includes('/duplicate')) {
        // Extract project ID from URL (format: /projects/{id}/duplicate)
        const pathParts = url.split('/');
        const projectId = pathParts[pathParts.indexOf('projects') + 1];

        // Create a duplicated project based on the original
        const projects = getMockProjects();
        const originalProject = projects.find(p => p.id === projectId);

        // Start with the original project data and override specific fields
        const duplicatedProject = {
          ...originalProject,
          id: `dup-${Date.now()}`, // New unique ID
          title: originalProject ? `Copy of ${originalProject.title}` : `Duplicated Project ${Date.now()}`,
          status: 'DRAFT', // New duplicated projects start as drafts
          createdAt: new Date().toISOString(), // Override with new creation date
          updatedAt: new Date().toISOString(), // Override with new update date
          // Keep other fields from the original project
        };

        return {
          data: duplicatedProject as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      }
    }

    try {
      return await this.client.post<T>(url, data, config);
    } catch (error) {
      const processedError = handleApiError(error);
      return Promise.reject(processedError);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (USE_MOCK_DATA) {
      // Handle specific PUT endpoints with mocks
      if (url.includes('/auth/profile')) {
        // Mock profile update response
        const currentUser = {
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
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date().toISOString(),
        };

        // Update with new data
        Object.assign(currentUser, data);
        Object.assign(currentUser.profile, data);

        return {
          data: currentUser as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/users/') && url.includes('/status')) {
        // Mock user status update response (admin)
        const pathParts = url.split('/');
        const userId = pathParts[pathParts.length - 2]; // /admin/users/{userId}/status

        return {
          data: {
            id: userId,
            status: data?.status || 'active',
            updatedAt: new Date().toISOString(),
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/users/')) {
        // Mock user update response
        const pathParts = url.split('/');
        const userId = pathParts[pathParts.length - 1];

        return {
          data: {
            id: userId || 'user-1',
            email: 'user@example.com',
            firstName: data?.firstName || 'Test',
            lastName: data?.lastName || 'User',
            role: data?.role || 'client',
            status: data?.status || 'verified',
            profile: {
              bio: data?.bio || 'Sample user profile',
              completed: data?.completed || true,
              ...data?.profile,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/projects/')) {
        // Mock project update response
        const pathParts = url.split('/');
        const projectId = pathParts[pathParts.length - 1];

        const projects = getMockProjects();
        const project = projects.find(p => p.id === projectId) || {
          id: projectId,
          title: 'Mock Project',
          description: 'Mock project description',
          category: 'Development',
          totalBudget: 100000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

        // Update project with provided data
        Object.assign(project, data);
        project.updatedAt = new Date().toISOString();

        return {
          data: project as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/milestones/')) {
        // Mock milestone update response
        const pathParts = url.split('/');
        const milestoneId = pathParts[pathParts.length - 1];

        const milestones = getMockMilestones();
        const milestone = milestones.find(m => m.id === milestoneId) || {
          id: milestoneId,
          projectId: 'proj-1',
          title: 'Mock Milestone',
          description: 'Mock milestone description',
          amount: 100000,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          acceptanceCriteria: 'Complete the deliverables as specified',
          currency: 'USD',
          autoApproveCountdown: 0
        };

        // Update milestone with provided data
        Object.assign(milestone, data);
        milestone.updatedAt = new Date().toISOString();

        return {
          data: milestone as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/notifications/')) {
        // Mock notification mark as read response
        if (url.includes('/read')) {
          const pathParts = url.split('/');
          const notificationId = pathParts[pathParts.length - 2]; // /notifications/{id}/read

          return {
            data: {
              id: notificationId,
              read: true,
              readAt: new Date().toISOString(),
            } as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
          } as AxiosResponse<T>;
        }
      } else if (url.includes('/notifications/read-all')) {
        // Mock mark all notifications as read response
        return {
          data: {
            success: true,
            count: getMockNotifications().length,
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      }
    }

    try {
      return await this.client.put<T>(url, data, config);
    } catch (error) {
      const processedError = handleApiError(error);
      return Promise.reject(processedError);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (USE_MOCK_DATA) {
      // Handle specific DELETE endpoints with mocks
    }

    try {
      return await this.client.delete<T>(url, config);
    } catch (error) {
      const processedError = handleApiError(error);
      return Promise.reject(processedError);
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (USE_MOCK_DATA) {
      // Handle specific PATCH endpoints with mocks
      if (url.includes('/projects/') && url.includes('/archive')) {
        // Extract project ID from URL (format: /projects/{id}/archive)
        const pathParts = url.split('/');
        const projectId = pathParts[pathParts.indexOf('projects') + 1];

        // Return a mock archived project
        const archivedProject = {
          id: projectId,
          title: `Project ${projectId}`,
          description: 'Mock archived project',
          category: 'General',
          totalBudget: 100000, // $1000.00 in cents
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'ARCHIVED',
          clientId: 'user-1',
          freelancerId: null,
          createdAt: new Date(),
          updatedAt: new Date().toISOString(),
          progress: 0,
          pendingReviews: 0,
          messages: 0,
          escrowBalance: 0,
          currency: 'USD',
          autoApproveDays: 7
        };

        return {
          data: archivedProject as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      }
    }

    try {
      return await this.client.patch<T>(url, data, config);
    } catch (error) {
      const processedError = handleApiError(error);
      return Promise.reject(processedError);
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;