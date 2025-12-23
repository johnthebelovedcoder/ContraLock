'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useAuthStore } from '@/lib/store/authStore';
import { useProjectStore } from '@/lib/store/projectStore';
import { invoiceService } from '@/lib/services/invoiceService';
import { InvoiceData, CreateInvoiceData, InvoiceItem } from '@/lib/services/invoiceService';
import { DollarSign, Calendar, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SubmitInvoicePage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading: authLoading } = useAuthStore();
  const { projects, fetchProjects, loading: projectsLoading } = useProjectStore();

  const [invoiceData, setInvoiceData] = useState<CreateInvoiceData>({
    projectId: projectId || '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    items: [
      { description: '', quantity: 1, rate: 0 }
    ],
    notes: '',
  });
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    clientEmail: '',
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'freelancer') {
      router.push('/dashboard');
      return;
    }

    if (projectId) {
      loadProjectData();
    }
  }, [isAuthenticated, user, router, projectId]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      // Try to get project from store first
      const project = projects.find(p => p.id === projectId);

      if (project) {
        // Update form data with project information
        setFormData({
          projectName: project.title,
          clientName: project.clientName || project.client?.name || 'Client',
          clientEmail: project.clientEmail || project.client?.email || 'client@example.com',
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        });
      } else {
        // If not in store, try to fetch from mock service
        // For demo purposes, we'll just set some defaults
        setFormData({
          projectName: 'Project ' + projectId,
          clientName: 'Client Name',
          clientEmail: 'client@example.com',
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        });
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { description: '', quantity: 1, rate: 0 }
      ]
    }));
  };

  const removeItem = (index: number) => {
    if (invoiceData.items.length <= 1) return; // Keep at least one item
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    return invoiceData.items.reduce((total, item) => total + (item.quantity * item.rate), 0);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!invoiceData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    if (!invoiceData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (new Date(invoiceData.dueDate) <= new Date(invoiceData.issueDate)) {
      newErrors.dueDate = 'Due date must be after issue date';
    }

    if (invoiceData.items.some(item => !item.description.trim())) {
      newErrors.items = 'All items must have a description';
    }

    if (invoiceData.items.some(item => item.quantity <= 0)) {
      newErrors.items = 'Quantity must be greater than 0';
    }

    if (invoiceData.items.some(item => item.rate < 0)) {
      newErrors.items = 'Rate cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Submit the invoice using the service
      const invoiceResult = await invoiceService.createInvoice({
        projectId: invoiceData.projectId,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        items: invoiceData.items,
        notes: invoiceData.notes,
      });

      // Show success message
      toast.success(`Invoice ${invoiceResult.invoiceNumber} submitted successfully to ${formData.clientName} (${formData.clientEmail})`);

      // Redirect back to project page
      router.push(`/dashboard/freelancer/projects/${projectId}`);
    } catch (error) {
      console.error('Error submitting invoice:', error);
      toast.error('Failed to submit invoice. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading invoice form...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Freelancer', href: '/dashboard/freelancer' },
          { name: 'Projects', href: '/dashboard/freelancer/projects' },
          { name: invoiceData.projectName, href: `/dashboard/freelancer/projects/${projectId}` },
          { name: 'Submit Invoice', current: true }
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold">Submit Invoice</h1>
        <p className="text-muted-foreground">
          Create and submit an invoice for project: {invoiceData.projectName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>
            Fill in the details for your invoice. The client will receive a notification when you submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Invoice Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Invoice Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    disabled
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <div className="relative">
                      <Input
                        id="issueDate"
                        type="date"
                        value={invoiceData.issueDate}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, issueDate: e.target.value }))}
                      />
                      <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.issueDate && <p className="text-sm text-destructive">{errors.issueDate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <div className="relative">
                      <Input
                        id="dueDate"
                        type="date"
                        value={invoiceData.dueDate}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                      <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate}</p>}
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Client Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Line Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              {invoiceData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6 space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="e.g. Website design, Development hours"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-3 space-y-2">
                    <Label>Rate (USD)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={invoiceData.items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}
            </div>

            {/* Invoice Summary */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (0%):</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span>${invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes for the client..."
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/freelancer/projects/${projectId}`)}
              >
                Cancel
              </Button>
              <Button type="submit">
                <FileText className="h-4 w-4 mr-2" />
                Submit Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}