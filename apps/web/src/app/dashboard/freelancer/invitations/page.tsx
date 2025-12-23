'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useProjectStore } from '@/lib/store/projectStore';
import { ProjectInvitation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Mail, CheckCircle, XCircle, Clock, FolderOpen, Grid3X3, List } from 'lucide-react';

export default function FreelancerInvitationsPage() {
  const { user, isAuthenticated, initializeAuth, loading: authLoading } = useAuthStore();
  const { invitations, fetchInvitations, acceptInvitation, declineInvitation, loading: storeLoading, initializeDemoData } = useProjectStore();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default to grid view

  useEffect(() => {
    initializeAuth();
    // Initialize demo data when component mounts
    initializeDemoData();
  }, [initializeAuth, initializeDemoData]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'freelancer' && user?._id) {
      // Try to fetch from store first, but ensure demo data is available
      fetchInvitations(user._id).catch(() => {
        // If fetch fails (no real data), demo data will be shown by default
        console.log("Using demo invitations data");
      });
    }
  }, [isAuthenticated, user?._id, user?.role, fetchInvitations]);

  const handleAccept = async (token: string) => {
    setLoadingAction(`accept-${token}`);
    setActionError(null);
    try {
      await acceptInvitation(token);
      // The store will update automatically
    } catch (error: any) {
      setActionError(error.message || 'Failed to accept invitation');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDecline = async (token: string) => {
    setLoadingAction(`decline-${token}`);
    setActionError(null);
    try {
      await declineInvitation(token);
      // The store will update automatically
    } catch (error: any) {
      setActionError(error.message || 'Failed to decline invitation');
    } finally {
      setLoadingAction(null);
    }
  };

  if (authLoading || storeLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading invitations...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'freelancer') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in as a freelancer to view invitations</p>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING');
  const acceptedInvitations = invitations.filter(inv => inv.status === 'ACCEPTED');
  const declinedInvitations = invitations.filter(inv => inv.status === 'DECLINED');
  const expiredInvitations = invitations.filter(inv => inv.status === 'EXPIRED');

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <Breadcrumb
          pages={[
            { name: 'Dashboard', href: '/dashboard' },
            { name: 'Freelancer', href: '/dashboard/freelancer' },
            { name: 'Invitations', current: true }
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Invitations</h1>
            <p className="text-muted-foreground">
              Manage project invitations sent to you by clients
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="all">All ({invitations.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingInvitations.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({acceptedInvitations.length})</TabsTrigger>
          <TabsTrigger value="declined">Declined ({declinedInvitations.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredInvitations.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{actionError}</p>
        </div>
      )}

      {/* Stats Cards - Only show for "all" tab */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvitations.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting your response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{acceptedInvitations.length}</div>
              <p className="text-xs text-muted-foreground">Projects you accepted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{declinedInvitations.length}</div>
              <p className="text-xs text-muted-foreground">Projects you declined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredInvitations.length}</div>
              <p className="text-xs text-muted-foreground">Expired invitations</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conditionally render sections based on active tab */}
      {(activeTab === 'all' || activeTab === 'pending') && (
        <div className="space-y-4">
          {activeTab === 'all' || activeTab === 'pending' ? (
            pendingInvitations.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingInvitations.map((invitation) => (
                    <Card key={invitation.token} className="flex flex-col h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Project {invitation.projectId}</CardTitle>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{invitation.clientEmail}</p>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-lg mb-4 flex-1">
                          <p className="text-sm text-muted-foreground">
                            You've been invited to work on this project. Please review the details and accept or decline.
                          </p>
                        </div>

                        <div className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                          <Clock className="h-4 w-4" />
                          <span>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                        </div>

                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              // Navigate to the invitation details page
                              window.location.href = `/dashboard/freelancer/invitations/details/${invitation.token}`;
                            }}
                          >
                            View Project Details
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleDecline(invitation.token)}
                              disabled={loadingAction === `decline-${invitation.token}`}
                            >
                              {loadingAction === `decline-${invitation.token}` ? 'Declining...' : 'Decline'}
                            </Button>
                            <Button
                              className="flex-1"
                              onClick={() => handleAccept(invitation.token)}
                              disabled={loadingAction === `accept-${invitation.token}`}
                            >
                              {loadingAction === `accept-${invitation.token}` ? 'Accepting...' : 'Accept'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // List view
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <Card key={invitation.token}>
                      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 sm:mb-0">
                            <h3 className="font-medium text-lg">Project {invitation.projectId}</h3>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            From: <span className="font-medium">{invitation.clientEmail}</span>
                            <span className="ml-2">| Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                            You've been invited to work on this project. Please review the details and accept or decline.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              // Navigate to the invitation details page
                              window.location.href = `/dashboard/freelancer/invitations/details/${invitation.token}`;
                            }}
                          >
                            View Details
                          </Button>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDecline(invitation.token)}
                              disabled={loadingAction === `decline-${invitation.token}`}
                            >
                              {loadingAction === `decline-${invitation.token}` ? 'Declining...' : 'Decline'}
                            </Button>
                            <Button
                              className="flex-1"
                              size="sm"
                              onClick={() => handleAccept(invitation.token)}
                              disabled={loadingAction === `accept-${invitation.token}`}
                            >
                              {loadingAction === `accept-${invitation.token}` ? 'Accepting...' : 'Accept'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              activeTab === 'pending' && (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending invitations</h3>
                  <p className="text-muted-foreground">
                    You don't have any pending project invitations at the moment.
                  </p>
                </div>
              )
            )
          ) : null}
        </div>
      )}

      {/* Accepted Invitations Section */}
      {(activeTab === 'all' || activeTab === 'accepted') && (
        <div className="space-y-4">
          {acceptedInvitations.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceptedInvitations.map((invitation) => (
                  <Card key={invitation.token}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{invitation.projectId}</CardTitle>
                        <Badge>Accepted</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{invitation.clientEmail}</p>
                      </div>

                      <div className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                        <CheckCircle className="h-4 w-4" />
                        <span>Accepted: {new Date(invitation.acceptedAt || '').toLocaleDateString()}</span>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => window.location.href = `/dashboard/freelancer/projects/${invitation.projectId}`}
                      >
                        View Project Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // List view
              <div className="space-y-4">
                {acceptedInvitations.map((invitation) => (
                  <Card key={invitation.token}>
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{invitation.projectId}</h3>
                          <Badge>Accepted</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          From: <span className="font-medium">{invitation.clientEmail}</span>
                          <span className="ml-2">| Accepted: {new Date(invitation.acceptedAt || '').toLocaleDateString()}</span>
                        </p>
                      </div>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={() => window.location.href = `/dashboard/freelancer/projects/${invitation.projectId}`}
                      >
                        View Project Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            activeTab === 'accepted' && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No accepted invitations</h3>
                <p className="text-muted-foreground">
                  You haven't accepted any project invitations yet.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Declined Invitations Section */}
      {(activeTab === 'all' || activeTab === 'declined') && (
        <div className="space-y-4">
          {declinedInvitations.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {declinedInvitations.map((invitation) => (
                  <Card key={invitation.token}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{invitation.projectId}</CardTitle>
                        <Badge variant="destructive">Declined</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{invitation.clientEmail}</p>
                      </div>

                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        <span>Declined: {new Date(invitation.declinedAt || '').toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // List view
              <div className="space-y-4">
                {declinedInvitations.map((invitation) => (
                  <Card key={invitation.token}>
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{invitation.projectId}</h3>
                          <Badge variant="destructive">Declined</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          From: <span className="font-medium">{invitation.clientEmail}</span>
                          <span className="ml-2">| Declined: {new Date(invitation.declinedAt || '').toLocaleDateString()}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            activeTab === 'declined' && (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No declined invitations</h3>
                <p className="text-muted-foreground">
                  You haven't declined any project invitations yet.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Expired Invitations Section */}
      {(activeTab === 'all' || activeTab === 'expired') && (
        <div className="space-y-4">
          {expiredInvitations.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {expiredInvitations.map((invitation) => (
                  <Card key={invitation.token}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{invitation.projectId}</CardTitle>
                        <Badge variant="secondary">Expired</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{invitation.clientEmail}</p>
                      </div>

                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Expired: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // List view
              <div className="space-y-4">
                {expiredInvitations.map((invitation) => (
                  <Card key={invitation.token}>
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{invitation.projectId}</h3>
                          <Badge variant="secondary">Expired</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          From: <span className="font-medium">{invitation.clientEmail}</span>
                          <span className="ml-2">| Expired: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            activeTab === 'expired' && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No expired invitations</h3>
                <p className="text-muted-foreground">
                  You don't have any expired invitations.
                </p>
              </div>
            )
          )}
        </div>
      )}


      {/* No invitations message */}
      {invitations.length === 0 && activeTab === 'all' && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No invitations yet</h3>
          <p className="text-muted-foreground">
            You don't have any project invitations at the moment.
            <br />
            Check back later or contact clients directly.
          </p>
        </div>
      )}
    </div>
  );
}