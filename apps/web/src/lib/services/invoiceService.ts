import { apiClient } from '@/lib/api/client';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number; // per unit
}

export interface InvoiceData {
  id?: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: InvoiceItem[];
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceData {
  projectId: string;
  issueDate: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    rate: number;
  }[];
  notes?: string;
}

class InvoiceService {
  async createInvoice(invoiceData: CreateInvoiceData): Promise<InvoiceData> {
    // In a real app, this would make an API call
    // For mock implementation, we'll return a mock invoice
    
    const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const mockInvoice: InvoiceData = {
      id: `inv-${Date.now()}`,
      projectId: invoiceData.projectId,
      projectName: 'Project Name', // Would be fetched from project in real app
      clientId: 'client-1', // Would be fetched from project in real app
      clientName: 'Client Name', // Would be fetched from project in real app
      clientEmail: 'client@example.com', // Would be fetched from project in real app
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: invoiceData.issueDate,
      dueDate: invoiceData.dueDate,
      status: 'SENT',
      items: invoiceData.items.map(item => ({
        id: `item-${Date.now()}-${Math.random()}`,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate
      })),
      notes: invoiceData.notes,
      subtotal,
      tax,
      total,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return mockInvoice;
  }

  async getInvoiceById(invoiceId: string): Promise<InvoiceData> {
    // In a real app, this would fetch from the backend
    // Mock implementation
    return {
      id: invoiceId,
      projectId: 'proj-1',
      projectName: 'Sample Project',
      clientId: 'client-1',
      clientName: 'John Client',
      clientEmail: 'john@example.com',
      invoiceNumber: `INV-${invoiceId.slice(-6)}`,
      issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
      status: 'SENT',
      items: [
        {
          id: 'item-1',
          description: 'Web Development Services',
          quantity: 40,
          rate: 50
        },
        {
          id: 'item-2',
          description: 'Design Consultation',
          quantity: 10,
          rate: 75
        }
      ],
      subtotal: 2750,
      tax: 275, // 10% tax
      total: 3025,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getInvoicesForProject(projectId: string): Promise<InvoiceData[]> {
    // In a real app, this would fetch from the backend
    // Mock implementation
    return [
      {
        id: 'inv-1',
        projectId,
        projectName: 'Sample Project',
        clientId: 'client-1',
        clientName: 'John Client',
        clientEmail: 'john@example.com',
        invoiceNumber: 'INV-001',
        issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
        status: 'PAID',
        items: [
          {
            id: 'item-1',
            description: 'Initial Setup',
            quantity: 10,
            rate: 50
          }
        ],
        subtotal: 500,
        tax: 50,
        total: 550,
        currency: 'USD',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'inv-2',
        projectId,
        projectName: 'Sample Project',
        clientId: 'client-1',
        clientName: 'John Client',
        clientEmail: 'john@example.com',
        invoiceNumber: 'INV-002',
        issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 23 days from now
        status: 'SENT',
        items: [
          {
            id: 'item-1',
            description: 'Development Phase',
            quantity: 30,
            rate: 60
          }
        ],
        subtotal: 1800,
        tax: 180,
        total: 1980,
        currency: 'USD',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  }

  async getInvoicesForFreelancer(freelancerId: string): Promise<InvoiceData[]> {
    // In a real app, this would fetch from the backend
    // Mock implementation
    return [
      {
        id: 'inv-1',
        projectId: 'proj-1',
        projectName: 'Website Redesign',
        clientId: 'client-1',
        clientName: 'John Client',
        clientEmail: 'john@example.com',
        invoiceNumber: 'INV-001',
        issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
        status: 'PAID',
        items: [
          {
            id: 'item-1',
            description: 'Initial Setup',
            quantity: 10,
            rate: 50
          }
        ],
        subtotal: 500,
        tax: 50,
        total: 550,
        currency: 'USD',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'inv-2',
        projectId: 'proj-2',
        projectName: 'Mobile App Development',
        clientId: 'client-2',
        clientName: 'Jane Client',
        clientEmail: 'jane@example.com',
        invoiceNumber: 'INV-002',
        issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 23 days from now
        status: 'SENT',
        items: [
          {
            id: 'item-1',
            description: 'Development Phase',
            quantity: 30,
            rate: 60
          }
        ],
        subtotal: 1800,
        tax: 180,
        total: 1980,
        currency: 'USD',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  }

  async updateInvoice(invoiceId: string, data: Partial<InvoiceData>): Promise<InvoiceData> {
    // In a real app, this would update the backend
    // Mock implementation
    return {
      id: invoiceId,
      projectId: 'proj-1',
      projectName: 'Sample Project',
      clientId: 'client-1',
      clientName: 'John Client',
      clientEmail: 'john@example.com',
      invoiceNumber: `INV-${invoiceId.slice(-6)}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: data.status || 'SENT',
      items: data.items || [
        {
          id: 'item-1',
          description: 'Web Development Services',
          quantity: 40,
          rate: 50
        }
      ],
      subtotal: data.subtotal || 2000,
      tax: data.tax || 200,
      total: data.total || 2200,
      currency: data.currency || 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    // In a real app, this would delete from the backend
    // Mock implementation
    console.log(`Invoice ${invoiceId} deleted`);
  }

  async sendInvoice(invoiceId: string): Promise<InvoiceData> {
    // In a real app, this would send the invoice via email
    // Mock implementation
    return {
      id: invoiceId,
      projectId: 'proj-1',
      projectName: 'Sample Project',
      clientId: 'client-1',
      clientName: 'John Client',
      clientEmail: 'john@example.com',
      invoiceNumber: `INV-${invoiceId.slice(-6)}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'SENT',
      items: [
        {
          id: 'item-1',
          description: 'Web Development Services',
          quantity: 40,
          rate: 50
        }
      ],
      subtotal: 2000,
      tax: 200,
      total: 2200,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const invoiceService = new InvoiceService();